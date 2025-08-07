import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true, // Extend session on activity
    cookie: {
      httpOnly: true,
      secure: false, // Disable secure for now to fix auth issues
      sameSite: 'lax',
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    try {
      const user = {};
      updateUserSession(user, tokens);
      const claims = tokens.claims();
      console.log('Authentication successful for user:', claims?.email);
      await upsertUser(claims);
      verified(null, user);
    } catch (error) {
      console.error('Verification error:', error);
      verified(error, null);
    }
  };

  const domains = process.env.REPLIT_DOMAINS!.split(",");
  
  // Add custom production domain
  domains.push('nxtkonektpartners.com');
  
  // Add localhost for development
  if (process.env.NODE_ENV === 'development') {
    domains.push('localhost:5000', 'localhost');
  }
  
  for (const domain of domains) {
    // Use HTTPS for production domains, HTTP for localhost development
    const protocol = domain.includes('localhost') ? 'http' : 'https';
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `${protocol}://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
    console.log(`Registered auth strategy for domain: ${domain} (${protocol})`);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    const hostname = req.get('host') || req.hostname;
    const invitationToken = req.query.invitation as string;
    
    console.log(`Login attempt for hostname: ${hostname}`);
    console.log('Available strategies:', Object.keys(passport._strategies || {}));
    
    if (invitationToken) {
      console.log(`🎫 Partner invitation login with token: ${invitationToken.substring(0, 8)}...`);
      // Store invitation token in session for use after authentication
      (req.session as any).invitationToken = invitationToken;
    }
    
    const strategyName = `replitauth:${hostname}`;
    
    // Check if strategy exists, try fallback strategies
    let finalStrategy = strategyName;
    if (!passport._strategy(strategyName)) {
      // Try without port for localhost
      const fallbackStrategy = `replitauth:${hostname.split(':')[0]}`;
      if (passport._strategy(fallbackStrategy)) {
        finalStrategy = fallbackStrategy;
        console.log(`Using fallback strategy: ${fallbackStrategy}`);
      } else {
        console.error(`No authentication strategy found for ${strategyName} or ${fallbackStrategy}`);
        return res.redirect('/login-error?reason=no_strategy');
      }
    }
    
    passport.authenticate(finalStrategy)(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    const hostname = req.get('host') || req.hostname;
    let strategyName = `replitauth:${hostname}`;
    
    console.log(`Callback for hostname: ${hostname}, strategy: ${strategyName}`);
    
    // Try fallback strategy if primary doesn't exist
    if (!passport._strategy(strategyName)) {
      const fallbackStrategy = `replitauth:${hostname.split(':')[0]}`;
      if (passport._strategy(fallbackStrategy)) {
        strategyName = fallbackStrategy;
        console.log(`Using fallback strategy for callback: ${fallbackStrategy}`);
      }
    }
    
    passport.authenticate(strategyName, (err, user, info) => {
      if (err) {
        console.error('Authentication error:', err);
        return res.redirect('/login-error?reason=auth_error');
      }
      
      if (!user) {
        console.error('Authentication failed - no user returned:', info);
        return res.redirect('/login-error?reason=no_user');
      }
      
      req.logIn(user, async (err) => {
        if (err) {
          console.error('Login session error:', err);
          return res.redirect('/login-error?reason=session_error');
        }
        
        console.log('User successfully authenticated:', user.claims?.email);
        
        // Check if this is an invitation-based signup
        const invitationToken = (req.session as any)?.invitationToken;
        if (invitationToken) {
          console.log(`🎫 Processing invitation token for user: ${user.claims?.email}`);
          
          try {
            // Import storage here to avoid circular dependency
            const { storage } = await import('./storage');
            
            // Verify and consume invitation
            const invitation = await storage.getPartnerInvitation(invitationToken);
            
            if (invitation && invitation.email === user.claims?.email && new Date() < new Date(invitation.expiresAt)) {
              console.log(`✅ Valid invitation found for ${user.claims?.email}`);
              
              // Track signup completion
              await storage.trackSignupEvent({
                event: 'signup_completed',
                email: user.claims?.email,
                invitationId: invitation.id,
                metadata: { userId: user.claims?.sub },
              });
              
              // Mark invitation as used
              await storage.markInvitationAsUsed(invitation.id);
              
              // Clear invitation from session
              delete (req.session as any).invitationToken;
              
              console.log(`🎉 Partner successfully signed up via invitation: ${user.claims?.email}`);
              return res.redirect('/dashboard?welcome=partner');
            } else {
              console.log(`❌ Invalid or expired invitation for ${user.claims?.email}`);
              // Clear invalid token and continue normal flow
              delete (req.session as any).invitationToken;
            }
            
          } catch (error) {
            console.error('Error processing invitation:', error);
            // Clear token and continue normal flow
            delete (req.session as any).invitationToken;
          }
        }
        
        return res.redirect('/');
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
