import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import { authApi, loadAccessTokenFromStorage, clearAuth } from "../utils/api";

export type AuthUser = {
    _id: string;
    name: string;
    email: string;
    role?: string;
    kycStatus?: string;
    accountStatus?: string;
    [key: string]: any;
};

export type LoginPayload = {
    email: string;
    password: string;
};

export type RegisterPayload = Record<string, any>;

type AuthContextValue = {
    user: AuthUser | null;
    isAuthenticated: boolean;
    initializing: boolean;
    loading: boolean;
    login: (payload: LoginPayload) => Promise<AuthUser | null>;
    register: (payload: RegisterPayload) => Promise<AuthUser | null>;
    logout: () => Promise<void>;
    reloadUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
    children: ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [initializing, setInitializing] = useState(true);
    const [loading, setLoading] = useState(false);

    const isAuthenticated = !!user;

    const normalizeUser = (raw: any): AuthUser | null => {
        if (!raw) return null;
        const accountStatus = raw.accountStatus || raw.status || raw.account_status || undefined;
        const kycStatus = raw.kycStatus || raw.kyc_status || raw.kyc || undefined;
        return {
            ...raw,
            accountStatus,
            kycStatus,
        };
    };

    const reloadUser = async () => {
        setLoading(true);
        try {
            const res = await authApi.me();
            const rawUser = res.data?.data?.user || res.data?.user || res.data || null;
            const u = normalizeUser(rawUser);
            if (u && u.accountStatus === "suspended") {
                clearAuth();
                setUser(null);
                throw new Error("Your account is suspended.");
            }
            setUser(u);
        } catch (err: any) {
            setUser(null);
            clearAuth();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = loadAccessTokenFromStorage();
        if (!token) {
            setInitializing(false);
            return;
        }
        (async () => {
            try {
                await reloadUser();
            } finally {
                setInitializing(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const login = async (payload: LoginPayload): Promise<AuthUser | null> => {
        setLoading(true);
        try {
            const res = await authApi.login(payload);
            const rawUser = res.data?.data?.user || res.data?.user || res.data || null;
            if (!rawUser) {
                setUser(null);
                return null;
            }
            const u = normalizeUser(rawUser);
            if (u && u.accountStatus === "suspended") {
                clearAuth();
                setUser(null);
                throw new Error("Your account is suspended.");
            }
            setUser(u);
            return u;
        } finally {
            setLoading(false);
        }
    };

    const register = async (payload: RegisterPayload): Promise<AuthUser | null> => {
        setLoading(true);
        try {
            const res = await authApi.register(payload);
            const rawUser = res.data?.data?.user || res.data?.user || res.data || null;
            if (!rawUser) {
                setUser(null);
                return null;
            }
            const u = normalizeUser(rawUser);
            if (u && u.accountStatus === "suspended") {
                clearAuth();
                setUser(null);
                throw new Error("Your account is suspended.");
            }
            setUser(u);
            return u;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await authApi.logout();
        } catch (e) {
            console.error(e);
        } finally {
            setUser(null);
            clearAuth();
            setLoading(false);
        }
    };

    const value: AuthContextValue = {
        user,
        isAuthenticated,
        initializing,
        loading,
        login,
        register,
        logout,
        reloadUser,
    };

    // debug: show module URL once to ensure single instance (optional)
    // console.log("AuthContext loaded:", import.meta.url);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return ctx;
};
