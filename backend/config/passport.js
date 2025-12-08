import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

export default function setupPassport() {
<<<<<<< HEAD
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
        async (accessToken, refreshToken, params, profile, done) => {
            try {
                let user = await User.findOne({ googleId: profile.id });
                if (!user) {
                    user = await User.create({
                        googleId: profile.id,
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        googlePicture: profile.photos?.[0]?.value || null,
                    });
=======
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL,
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    let user = await User.findOne({ googleId: profile.id });
                    if (!user) {
                        user = await User.create({
                            googleId: profile.id,
                            name: profile.displayName,
                            email: profile.emails[0].value,
                            googlePicture: profile.photos[0]?.value || null,
                        });
                    }
                    done(null, user);
                } catch (err) {
                    done(err, null);
>>>>>>> 3fa0a2ed2ee2fd84e67d144275f2428e3d4f03fe
                }

                user.googleAccessToken = accessToken;
                user.googleRefreshToken = refreshToken || user.googleRefreshToken;
                await user.save();

                done(null, user);
            } catch (err) {
                done(err, null);
            }
        }
    ));

    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser(async (id, done) => {
        const user = await User.findById(id);
        done(null, user);
    });
}