import fs from "fs";
import path from "path";
import bcryptjs from "bcryptjs";

export interface StoredKyc {
  id: string;
  userId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  documentType: string;
  documentUrl?: string | null;
  idNumber?: string | null;
  rejectionReason?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  [key: string]: any;
}

export interface StoredEscrowWallet {
  id: string;
  vendorId: string;
  balance: number;
  pendingBalance: number;
  currency: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface StoredUser {
  id: string;
  email: string;
  password?: string;
  name: string;
  phone?: string | null;
  role: "BUYER" | "VENDOR" | "DRIVER" | "INVESTOR" | "ADMIN" | string;
  isEmailVerified: boolean;
  verificationTokenHash?: string | null;
  verificationTokenExpiry?: string | Date | null;
  resetTokenHash?: string | null;
  resetTokenExpiry?: string | Date | null;
  passwordChangedAt?: string | Date | null;
  bankName?: string | null;
  accountNumber?: string | null;
  taxId?: string | null;
  referralCode?: string | null;
  referredById?: string | null;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string | null;
  twoFactorRecoveryCodes?: string[] | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  kyc?: StoredKyc | null;
  escrowWallet?: StoredEscrowWallet | null;
  [key: string]: any;
}

export interface StoredDataSchema {
  version: number;
  lastUpdated: string;
  users: Record<string, StoredUser>; // Keyed by email (lowercase)
  usersById: Record<string, string>; // ID to email map
  kycs: Record<string, StoredKyc>; // Keyed by userId
  wallets: Record<string, StoredEscrowWallet>; // Keyed by vendorId
  products: Record<string, any>; // Keyed by product ID
  orders: Record<string, any>; // Keyed by order ID
  investments: Record<string, any>; // Keyed by investment ID
  investmentProjects: Record<string, any>; // Keyed by project ID
  liveStreams: Record<string, any>; // Keyed by stream ID
  auditLogs: any[];
}

const STORE_PATH = path.resolve(process.cwd(), "persistent_data_store.json");
const BACKUP_PATH = path.resolve(process.cwd(), "backup_production_data.json");

class PersistentStoreManager {
  private data: StoredDataSchema = {
    version: 1,
    lastUpdated: new Date().toISOString(),
    users: {},
    usersById: {},
    kycs: {},
    wallets: {},
    products: {},
    orders: {},
    investments: {},
    investmentProjects: {},
    liveStreams: {},
    auditLogs: [],
  };

  private isLoaded = false;
  private saveDebounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initStore();
  }

  private initStore() {
    try {
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.users === "object") {
          this.data = parsed;
          this.isLoaded = true;
          this.ensureDefaultUsers();
          console.log(`✅ [Persistence] Loaded ${Object.keys(this.data.users).length} users from disk storage (${STORE_PATH}).`);
          return;
        }
      }
    } catch (err) {
      console.warn("⚠️ [Persistence] Could not parse persistent_data_store.json, attempting backup load:", err);
    }

    // Try loading from backup_production_data.json
    try {
      if (fs.existsSync(BACKUP_PATH)) {
        const rawBackup = fs.readFileSync(BACKUP_PATH, "utf-8");
        const parsedBackup = JSON.parse(rawBackup);
        if (parsedBackup && Array.isArray(parsedBackup.users)) {
          for (const u of parsedBackup.users) {
            const email = (u.email || "").toLowerCase().trim();
            if (email) {
              this.data.users[email] = {
                ...u,
                isEmailVerified: true,
                createdAt: u.createdAt || new Date().toISOString(),
                updatedAt: u.updatedAt || new Date().toISOString(),
              };
              this.data.usersById[u.id] = email;
              if (u.kyc) this.data.kycs[u.id] = u.kyc;
              if (u.escrowWallet) this.data.wallets[u.id] = u.escrowWallet;
            }
          }
          if (Array.isArray(parsedBackup.products)) {
            for (const p of parsedBackup.products) {
              this.data.products[p.id] = p;
            }
          }
          console.log(`✅ [Persistence] Initialized data store from backup_production_data.json (${Object.keys(this.data.users).length} users).`);
        }
      }
    } catch (bErr) {
      console.warn("⚠️ [Persistence] Could not load backup_production_data.json:", bErr);
    }

    this.ensureDefaultUsers();
    this.saveImmediate();
    this.isLoaded = true;
  }

  private ensureDefaultUsers() {
    const defaultPasswordHash = bcryptjs.hashSync("missavedji2026*", 12);

    const defaultAdminAccounts: StoredUser[] = [
      {
        id: "admin-official-lgfmall-boutique",
        email: "lgfmall.lmdg11@gmail.com",
        name: "LGF's Mall",
        phone: "+228 72 99 81 48",
        role: "ADMIN",
        password: defaultPasswordHash,
        isEmailVerified: true,
        bankName: "Ecobank Togo",
        accountNumber: "TG05401001",
        taxId: "TG-NIF-2026-LGF",
        referralCode: "LGFMALL",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: new Date().toISOString(),
        kyc: {
          id: "kyc-lgfmall",
          userId: "admin-official-lgfmall-boutique",
          status: "APPROVED",
          documentType: "BUSINESS_REGISTRATION",
          documentUrl: "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=600",
          idNumber: "TG-LOM-2026-LGFSTORE",
          rejectionReason: null,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: new Date().toISOString(),
        },
        escrowWallet: {
          id: "wallet-lgfmall",
          vendorId: "admin-official-lgfmall-boutique",
          balance: 0,
          pendingBalance: 0,
          currency: "XOF",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: new Date().toISOString(),
        },
      },
      {
        id: "admin-master-global",
        email: "arriveramegne@gmail.com",
        name: "LGF Admin Global",
        phone: "+228 96979976",
        role: "ADMIN",
        password: defaultPasswordHash,
        isEmailVerified: true,
        referralCode: "LGFADMIN",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: new Date().toISOString(),
      },
      {
        id: "admin-support-lgfmall",
        email: "lgfmall.lmd11@gmail.com",
        name: "LGF Admin Support",
        phone: "+228 72 99 81 48",
        role: "ADMIN",
        password: defaultPasswordHash,
        isEmailVerified: true,
        referralCode: "LGFSUPPORT",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: new Date().toISOString(),
      },
      {
        id: "user-ferdinand-meugre",
        email: "meuferdi@gmail.com",
        name: "Ferdinand Meugré",
        phone: "+228 90 00 00 00",
        role: "BUYER",
        password: defaultPasswordHash,
        isEmailVerified: true,
        referralCode: "FERDI2026",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: new Date().toISOString(),
      },
      {
        id: "user-official-store-tg",
        email: "official.store@lgfmall.tg",
        name: "LGF's Mall Official Store",
        phone: "+228 72 99 81 48",
        role: "VENDOR",
        password: defaultPasswordHash,
        isEmailVerified: true,
        referralCode: "OFFICIALTG",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: new Date().toISOString(),
      },
      {
        id: "user-koffi-togo",
        email: "koffi.togo@gmail.com",
        name: "Koffi Mensah",
        phone: "+228 91 00 11 22",
        role: "BUYER",
        password: defaultPasswordHash,
        isEmailVerified: true,
        referralCode: "KOFFI2026",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: new Date().toISOString(),
      },
      {
        id: "user-investor-togo",
        email: "investor.togo@lgfmall.com",
        name: "Investisseur Privé Lomé",
        phone: "+228 91 22 33 44",
        role: "INVESTOR",
        password: defaultPasswordHash,
        isEmailVerified: true,
        referralCode: "INVSTOGO",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: new Date().toISOString(),
      },
      {
        id: "user-driver-express",
        email: "driver.express@lgfmall.com",
        name: "Livreur Express LGF",
        phone: "+228 92 33 44 55",
        role: "DRIVER",
        password: defaultPasswordHash,
        isEmailVerified: true,
        referralCode: "DRIVELGF",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const u of defaultAdminAccounts) {
      const email = u.email.toLowerCase().trim();
      if (!this.data.users[email]) {
        this.data.users[email] = u;
        this.data.usersById[u.id] = email;
      } else {
        // Ensure admin role and verification status
        if (u.role === "ADMIN") {
          this.data.users[email].role = "ADMIN";
          this.data.users[email].isEmailVerified = true;
        }
      }
    }
  }

  public saveImmediate() {
    try {
      this.data.lastUpdated = new Date().toISOString();
      const tmpPath = `${STORE_PATH}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), "utf-8");
      fs.renameSync(tmpPath, STORE_PATH);
    } catch (err) {
      console.error("🚨 [Persistence] Error saving persistent data store to disk:", err);
    }
  }

  public scheduleSave() {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    this.saveDebounceTimer = setTimeout(() => {
      this.saveImmediate();
    }, 100);
  }

  // --- USER METHODS ---
  public getUserByEmail(email: string): StoredUser | null {
    if (!email) return null;
    const clean = email.toLowerCase().trim();
    const user = this.data.users[clean];
    if (!user) return null;

    // Attach KYC & EscrowWallet if available
    const kyc = this.data.kycs[user.id] || user.kyc || null;
    const escrowWallet = this.data.wallets[user.id] || user.escrowWallet || null;
    return { ...user, kyc, escrowWallet };
  }

  public getUserById(id: string): StoredUser | null {
    if (!id) return null;
    const email = this.data.usersById[id];
    if (email && this.data.users[email]) {
      return this.getUserByEmail(email);
    }
    // Linear scan fallback
    for (const u of Object.values(this.data.users)) {
      if (u.id === id) {
        return this.getUserByEmail(u.email);
      }
    }
    return null;
  }

  public getAllUsers(): StoredUser[] {
    return Object.values(this.data.users).map((u) => {
      const kyc = this.data.kycs[u.id] || u.kyc || null;
      const escrowWallet = this.data.wallets[u.id] || u.escrowWallet || null;
      return { ...u, kyc, escrowWallet };
    });
  }

  public saveUser(user: Partial<StoredUser> & { email: string }): StoredUser {
    const cleanEmail = user.email.toLowerCase().trim();
    const existing = this.data.users[cleanEmail] || {};
    const id = user.id || existing.id || `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const fullUser: StoredUser = {
      ...existing,
      ...user,
      id,
      email: cleanEmail,
      name: user.name || existing.name || cleanEmail.split("@")[0],
      role: user.role || existing.role || "BUYER",
      isEmailVerified: user.isEmailVerified !== undefined ? user.isEmailVerified : (existing.isEmailVerified !== undefined ? existing.isEmailVerified : true),
      createdAt: existing.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (user.kyc) {
      this.data.kycs[id] = user.kyc;
      fullUser.kyc = user.kyc;
    }
    if (user.escrowWallet) {
      this.data.wallets[id] = user.escrowWallet;
      fullUser.escrowWallet = user.escrowWallet;
    }

    this.data.users[cleanEmail] = fullUser;
    this.data.usersById[id] = cleanEmail;

    this.scheduleSave();
    return fullUser;
  }

  public updateUser(idOrEmail: string, updates: Partial<StoredUser>): StoredUser | null {
    const current = idOrEmail.includes("@") ? this.getUserByEmail(idOrEmail) : this.getUserById(idOrEmail);
    if (!current) return null;
    return this.saveUser({ ...current, ...updates });
  }

  // --- KYC METHODS ---
  public saveKyc(kyc: StoredKyc) {
    this.data.kycs[kyc.userId] = kyc;
    const user = this.getUserById(kyc.userId);
    if (user) {
      user.kyc = kyc;
      this.data.users[user.email] = user;
    }
    this.scheduleSave();
    return kyc;
  }

  public getKycByUserId(userId: string): StoredKyc | null {
    return this.data.kycs[userId] || null;
  }

  public getAllKycs(): StoredKyc[] {
    return Object.values(this.data.kycs);
  }

  // --- WALLET METHODS ---
  public saveWallet(wallet: StoredEscrowWallet) {
    this.data.wallets[wallet.vendorId] = wallet;
    const user = this.getUserById(wallet.vendorId);
    if (user) {
      user.escrowWallet = wallet;
      this.data.users[user.email] = user;
    }
    this.scheduleSave();
    return wallet;
  }

  public getWalletByVendorId(vendorId: string): StoredEscrowWallet | null {
    return this.data.wallets[vendorId] || null;
  }

  // --- PRODUCT METHODS ---
  public getProducts(): any[] {
    return Object.values(this.data.products);
  }

  public getProductById(id: string): any | null {
    return this.data.products[id] || null;
  }

  public saveProduct(product: any): any {
    const id = product.id || `prod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const fullProduct = {
      ...product,
      id,
      updatedAt: new Date().toISOString(),
      createdAt: product.createdAt || new Date().toISOString(),
    };
    this.data.products[id] = fullProduct;
    this.scheduleSave();
    return fullProduct;
  }

  public deleteProduct(id: string): boolean {
    if (this.data.products[id]) {
      delete this.data.products[id];
      this.scheduleSave();
      return true;
    }
    return false;
  }

  // --- ORDER METHODS ---
  public getOrders(): any[] {
    return Object.values(this.data.orders);
  }

  public getOrderById(id: string): any | null {
    return this.data.orders[id] || null;
  }

  public saveOrder(order: any): any {
    const id = order.id || `ord-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const fullOrder = {
      ...order,
      id,
      updatedAt: new Date().toISOString(),
      createdAt: order.createdAt || new Date().toISOString(),
    };
    this.data.orders[id] = fullOrder;
    this.scheduleSave();
    return fullOrder;
  }

  // --- LOGS ---
  public addAuditLog(log: any) {
    this.data.auditLogs.unshift({
      ...log,
      id: log.id || `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
    });
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs.pop();
    }
    this.scheduleSave();
  }

  public getAuditLogs(): any[] {
    return this.data.auditLogs;
  }
}

export const persistentStore = new PersistentStoreManager();
