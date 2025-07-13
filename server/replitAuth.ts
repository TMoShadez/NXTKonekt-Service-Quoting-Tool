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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Help with cross-site issues
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
    
    console.log(`Login attempt for hostname: ${hostname}`);
    console.log('Available strategies:', Object.keys(passport._strategies || {}));
    
    // Redirect localhost users to production domain for authentication
    if (hostname.includes('localhost')) {
      const productionDomain = domains.find(d => !d.includes('localhost'));
      if (productionDomain) {
        console.log(`Redirecting localhost user to production domain: ${productionDomain}`);
        return res.redirect(`https://${productionDomain}/api/login`);
      }
    }
    
    const strategyName = `replitauth:${hostname}`;
    
    // Check if strategy exists, try fallback strategies
    let strategy = passport._strategy(strategyName);
    if (!strategy) {
      // Try without port for localhost
      const fallbackStrategy = `replitauth:${hostname.split(':')[0]}`;
      strategy = passport._strategy(fallbackStrategy);
      if (strategy) {
        console.log(`Using fallback strategy: ${fallbackStrategy}`);
        return passport.authenticate(fallbackStrategy, {
          prompt: "select_account",
          scope: ["openid", "email", "profile", "offline_access"],
        })(req, res, next);
      }
    }
    
    if (!strategy) {
      console.error(`No authentication strategy found for ${strategyName} or fallbacks`);
      return res.redirect('/login-error?reason=no_strategy');
    }
    
    passport.authenticate(strategyName, {
      prompt: "select_account",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
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
      
      req.logIn(user, (err) => {
        if (err) {
          console.error('Login session error:', err);
          return res.redirect('/login-error?reason=session_error');
        }
        
        console.log('User successfully authenticated:', user.claims?.email);
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
