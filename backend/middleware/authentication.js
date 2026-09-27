// backend/middleware/authentication.js
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Local strategy for username/password login
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return done(null, false, { message: 'Incorrect email.' });
    if (!user.passwordHash) return done(null, false, { message: 'No password set.' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return done(null, false, { message: 'Incorrect password.' });
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// JWT strategy for protecting routes
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'change_this_secret',
};
passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return done(null, false);
    return done(null, user);
  } catch (err) {
    return done(err, false);
  }
}));

// Serialize / deserialize (required but not used with JWT)
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = { passport };

// authentication.js

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");

// Local Strategy
passport.use(
    new LocalStrategy(
        { usernameField: "email", passwordField: "password", },
        async (email, password, done) => {
            try {
                const user = await prisma.user.findUnique({ where: { email, }, });

                if (!user) {
                    return done(null, false, {
                        message: "Invalid email or password.",
                    });
                }

                const isMatch = await bcrypt.compare(password, user.password);

                if (!isMatch) {
                    return done(null, false, {
                        message: "Invalid email or password.",
                    });
                }

                return done(null, {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                });
            } catch (error) {
                return done(error);
            }
        }
    )
);

// JWT Strategy
passport.use(
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_SECRET,
        },
        async (payload, done) => {
            try {
                const user = await prisma.user.findUnique({
                    where: {
                        id: payload.id,
                    },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                    },
                });

                if (!user) {
                    return done(null, false);
                }

                return done(null, user);
            } catch (error) {
                return done(error);
            }
        }
    )
);

// Middleware
const authenticateJWT = passport.authenticate("jwt", { session: false, });

module.exports = { passport, authenticateJWT, };