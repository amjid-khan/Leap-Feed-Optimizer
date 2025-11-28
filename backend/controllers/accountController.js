import Account from "../models/Account.js";
import User from "../models/User.js";

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const buildAccessQuery = (user) => {
    const clauses = [{ userId: user._id }];
    if (user.email) {
        clauses.push({ authorizedEmails: normalizeEmail(user.email) });
    }
    return { $or: clauses };
};

const isOwner = (account, userId) =>
    account.userId && account.userId.toString() === userId.toString();

const hasEmailAccess = (account, email) =>
    Array.isArray(account.authorizedEmails) &&
    account.authorizedEmails.some((addr) => addr === normalizeEmail(email));

const userCanAccessAccount = (account, user) =>
    isOwner(account, user._id) || hasEmailAccess(account, user.email);

// Get all accounts for logged-in user
export const getUserAccounts = async (req, res) => {
    try {
        const accounts = await Account.find(buildAccessQuery(req.user)).sort({
            createdAt: -1,
        });

        res.status(200).json({
            success: true,
            accounts,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch accounts",
            error: error.message,
        });
    }
};

// Update account
export const updateAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const { accountName, merchantId } = req.body;
        const userId = req.user._id;

        const account = await Account.findById(id);
        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found",
            });
        }

        if (!isOwner(account, userId)) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to update this account",
            });
        }

        // Check if merchantId is being changed and if it conflicts
        if (merchantId && merchantId !== account.merchantId) {
            const existingAccount = await Account.findOne({
                userId,
                merchantId,
            });
            if (existingAccount) {
                return res.status(400).json({
                    success: false,
                    message: "Account with this merchant ID already exists",
                });
            }
        }

        if (accountName) account.accountName = accountName;
        if (merchantId) account.merchantId = merchantId;

        await account.save();

        res.status(200).json({
            success: true,
            message: "Account updated successfully",
            account: account,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update account",
            error: error.message,
        });
    }
};

// Delete account
export const deleteAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const account = await Account.findById(id);
        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found",
            });
        }

        if (!isOwner(account, userId)) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to delete this account",
            });
        }

        await Account.findByIdAndDelete(id);

        // Clear selected account for owner if necessary
        const owner = await User.findById(userId);
        if (owner && owner.selectedAccount && owner.selectedAccount.toString() === id) {
            owner.selectedAccount = null;
            await owner.save();
        }

        res.status(200).json({
            success: true,
            message: "Account deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete account",
            error: error.message,
        });
    }
};

// Get single account
export const getAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const account = await Account.findById(id);
        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found",
            });
        }

        if (!userCanAccessAccount(account, user)) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this account",
            });
        }

        res.status(200).json({
            success: true,
            account: account,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch account",
            error: error.message,
        });
    }
};

// Switch to an account (set as selected)
export const switchAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const account = await Account.findById(id);
        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found",
            });
        }

        if (!userCanAccessAccount(account, user)) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this account",
            });
        }

        // Update user's selected account
        const dbUser = await User.findById(user._id);
        dbUser.selectedAccount = account._id;
        await dbUser.save();

        res.status(200).json({
            success: true,
            message: "Account switched successfully",
            account: account,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to switch account",
            error: error.message,
        });
    }
};

