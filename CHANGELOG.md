# 📝 Changelog - Breach Rabbit HostPanel Pro

## Version 1.0.0 - Initial Release (2026-02-12)

### ✅ Fixed Issues

#### 1. PostgreSQL Permissions (CRITICAL FIX)
**Problem:** `permission denied for schema public` error on `prisma db push`

**Root Cause:** PostgreSQL 15+ changed default permissions - regular users no longer have CREATE privileges on public schema by default.

**Solution:**
```bash
ALTER SCHEMA public OWNER TO br_admin;
GRANT ALL ON SCHEMA public TO br_admin;
```

**Files Changed:**
- `install.sh` - Added schema permission grants

---

#### 2. Missing Root Page (404 Error)
**Problem:** Accessing server IP showed Next.js 404 page

**Root Cause:** No `app/page.tsx` file to handle root route

**Solution:** Created redirect page

**Files Added:**
- `app/page.tsx` - Redirects to `/dashboard`

---

#### 3. Tailwind CSS Not Working
**Problem:** Dark background loads but no component styling (buttons, cards plain HTML)

**Root Cause:** Multiple issues:
1. Missing `postcss.config.js`
2. Incomplete content paths in `tailwind.config.js`
3. Missing `globals.css` import in `layout.tsx`

**Solution:**

**Files Fixed:**
- `postcss.config.js` - Created with Tailwind plugin
- `tailwind.config.js` - Expanded content paths to include all subdirectories
- `app/layout.tsx` - Added `import "./globals.css"`
- `app/globals.css` - Verified Tailwind directives order

---

#### 4. Authentication System
**Problem:** No login functionality, no admin user

**Solution:** Complete NextAuth integration

**Files Added:**
- `lib/auth.ts` - NextAuth configuration with credentials provider
- `middleware.ts` - Route protection for `/dashboard/*`
- `app/api/auth/[...nextauth]/route.ts` - NextAuth API endpoint
- `app/login/page.tsx` - Login page with form
- `prisma/seed.ts` - Admin user creation script

**Default Credentials:**
- Email: `admin@breachrabbit.pro`
- Password: `admin123`

---

#### 5. Updated Tech Stack
**Previous:** Generic PHP/MySQL versions

**Updated:**
- PHP: 8.3, 8.4 (repo prepared for 8.5)
- MariaDB: 11.4 (latest stable)
- OpenLiteSpeed: 1.8
- Nginx: 1.28 (mainline)
- PostgreSQL: 16
- Redis: 7
- Node.js: 20

**Files Changed:**
- `install.sh` - Updated package versions
- `README.md` - Updated documentation

---

### 🆕 New Features

#### Authentication & Authorization
- ✅ NextAuth.js integration
- ✅ Credentials-based login
- ✅ JWT sessions (24h expiry)
- ✅ Protected routes middleware
- ✅ Role-based access (ADMIN/CLIENT/DEVELOPER)
- ✅ Last login tracking

#### Database Seeding
- ✅ Automatic admin user creation
- ✅ `npm run db:seed` command
- ✅ bcrypt password hashing

#### UI/UX Improvements
- ✅ Proper Tailwind CSS compilation
- ✅ Dark theme by default
- ✅ Login page with Breach Rabbit branding
- ✅ Error handling on login
- ✅ Loading states

#### Installation Script
- ✅ Automated PostgreSQL setup with permissions fix
- ✅ MariaDB secure installation
- ✅ OpenLiteSpeed admin password setup
- ✅ PM2 process management
- ✅ Firewall configuration
- ✅ Environment variable generation
- ✅ Automatic build and startup

---

### 📦 Dependencies Added

```json
{
  "next-auth": "^4.24.5",
  "bcryptjs": "^2.4.3",
  "@types/bcryptjs": "^2.4.6",
  "ts-node": "^10.9.2"
}
```

---

### 🗂️ File Structure Changes

```
Added:
  ├── app/page.tsx
  ├── app/login/page.tsx
  ├── app/api/auth/[...nextauth]/route.ts
  ├── lib/auth.ts
  ├── middleware.ts
  ├── prisma/seed.ts
  └── postcss.config.js

Modified:
  ├── install.sh (PostgreSQL permissions, complete automation)
  ├── tailwind.config.js (content paths)
  ├── app/layout.tsx (globals.css import)
  ├── package.json (new dependencies, seed script)
  └── README.md (comprehensive documentation)
```

---

### 🔧 Configuration Changes

#### tailwind.config.js
```javascript
content: [
  './pages/**/*.{ts,tsx}',
  './components/**/*.{ts,tsx}',
  './app/**/*.{ts,tsx}',      // ← Added
  './src/**/*.{ts,tsx}',
]
```

#### app/layout.tsx
```typescript
import "./globals.css";  // ← Added
```

#### package.json
```json
{
  "scripts": {
    "db:seed": "ts-node prisma/seed.ts"  // ← Added
  }
}
```

---

### 🔐 Security Improvements

1. **Password Hashing:** bcrypt with salt rounds 10
2. **JWT Secrets:** Auto-generated 32-byte random strings
3. **Session Security:** 24h expiry, httpOnly cookies
4. **Route Protection:** Middleware guards all dashboard routes
5. **Firewall:** UFW enabled with minimal open ports

---

### 📊 Testing Checklist

- [x] PostgreSQL schema creation works
- [x] Prisma migrations apply successfully
- [x] Admin user seeds correctly
- [x] Login page loads and styled properly
- [x] Authentication flow works
- [x] Dashboard accessible after login
- [x] Redirect works from root to dashboard
- [x] Tailwind styles apply correctly
- [x] Dark theme displays properly
- [x] Sites page renders
- [x] Databases page renders
- [x] Logout works
- [x] Protected routes redirect to login

---

### 🚀 Deployment Notes

**Recommended Installation:**
```bash
chmod +x install.sh
sudo ./install.sh
```

**Manual Steps After Install:**
1. Change default admin password
2. Change default OLS admin password
3. Change default database passwords
4. Configure domain name
5. Setup SSL certificates

---

### 📝 Known Limitations

1. **No Registration Page:** Admin users must be created via seed script
2. **No Password Reset:** Feature not yet implemented
3. **No Email Verification:** Email configuration optional
4. **Development Mode:** SSL not configured by default
5. **Single Server:** Multi-server support not yet implemented

---

### 🔮 Planned Features (v1.1.0)

- [ ] Complete Sites API (create WordPress sites)
- [ ] SSL automation (Let's Encrypt integration)
- [ ] File manager implementation
- [ ] Database management tools
- [ ] Backup scheduling
- [ ] Email notifications
- [ ] User management UI
- [ ] Settings page

---

### 🐛 Bug Fixes

- Fixed: PostgreSQL permission denied error
- Fixed: Root page 404
- Fixed: Tailwind CSS not compiling
- Fixed: No authentication system
- Fixed: Missing PostCSS config

---

### 📚 Documentation

- [x] README.md - Complete setup guide
- [x] CHANGELOG.md - This file
- [x] .env.example - Environment template
- [x] Inline code comments
- [x] JSDoc for functions

---

**Contributors:** Breach Rabbit Team
**Release Date:** February 12, 2026
**Status:** Stable ✅
