import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

export default function setupPassport() {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL, // e.g. http://localhost:5000/api/auth/google/callback
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Get profile picture from Google
                    const profilePicture = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
                    
                    let user = await User.findOne({ googleId: profile.id });
                    if (!user) {
                        user = await User.create({
                            googleId: profile.id,
                            name: profile.displayName,
                            email: profile.emails[0].value,
                            googlePicture: profilePicture,
                        });
                    } else {
                        // Update profile picture if user exists but doesn't have one or if it changed
                        if (profilePicture && user.googlePicture !== profilePicture) {
                            user.googlePicture = profilePicture;
                            await user.save();
                        }
                    }
                    done(null, user);
                } catch (err) {
                    done(err, null);
                }
            }
        )
    );

    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser(async (id, done) => {
        const user = await User.findById(id);
        done(null, user);
    });
}
