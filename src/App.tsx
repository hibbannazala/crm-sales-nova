import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, Lead, EditRequest, GlobalTarget, IndividualTarget, AuditLog, PermissionSet, RolePermissions, DEFAULT_PERMISSIONS, LORD_PERMISSIONS } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import LeadsTable from './components/LeadsTable';
import AdminUsers from './components/AdminUsers';
import AdminApprovals from './components/AdminApprovals';
import AdminTargets from './components/AdminTargets';
import PermissionSettings from './components/PermissionSettings';
import Tasks from './components/Tasks';
import OIForecastPage from './components/OIForecast/OIForecastPage';
import LeadDetail from './components/LeadDetail';
import { Toaster, toast } from 'sonner';
import { LogOut, UserCheck, Loader2, Zap, ShieldCheck, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

const SUPER_ADMIN_EMAILS = ["hibban25nzl@gmail.com", "thickandthinmedia26@gmail.com"];

function AppContent() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [approvals, setApprovals] = useState<EditRequest[]>([]);
  const [targets, setTargets] = useState<GlobalTarget[]>([]);
  const [individualTargets, setIndividualTargets] = useState<IndividualTarget[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>(DEFAULT_PERMISSIONS);
  const location = useLocation();
  const navigate = useNavigate();

  // Resolve permissions for the current user's role
  const permissions: PermissionSet = user?.role === 'lord' 
    ? LORD_PERMISSIONS 
    : user?.role === 'admin' 
      ? rolePermissions.admin 
      : user?.role === 'staff' 
        ? rolePermissions.staff 
        : DEFAULT_PERMISSIONS.staff;

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        let userData: UserProfile;
        if (!userSnap.exists()) {
          userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'User',
            role: firebaseUser.email && SUPER_ADMIN_EMAILS.includes(firebaseUser.email.toLowerCase()) ? 'lord' : 'pending'
          };
          await setDoc(userRef, userData);
        } else {
          userData = userSnap.data() as UserProfile;
          // Auto-upgrade to lord if in the list but role is different
          if (firebaseUser.email && SUPER_ADMIN_EMAILS.includes(firebaseUser.email.toLowerCase()) && userData.role !== 'lord') {
            userData.role = 'lord';
            await setDoc(userRef, userData);
          }
        }
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubAuth();
  }, []);

  // Load role permissions from Firestore
  useEffect(() => {
    const unsubPerms = onSnapshot(doc(db, "settings", "permissions"), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as RolePermissions;
        setRolePermissions({
          admin: { ...DEFAULT_PERMISSIONS.admin, ...data.admin },
          staff: { ...DEFAULT_PERMISSIONS.staff, ...data.staff }
        });
      }
    });
    return () => unsubPerms();
  }, []);

  useEffect(() => {
    if (!user || user.role === 'pending') return;

    // Filter leads that are NOT deleted
    import('firebase/firestore').then(({ query, where }) => {
      const leadsQuery = query(collection(db, "leads"), where("isDeleted", "==", false));
      // Fallback for leads that don't have isDeleted field yet
      const unsubLeads = onSnapshot(collection(db, "leads"), (snap) => {
        const leadsData: Lead[] = [];
        snap.docs.forEach(d => {
          const data = d.data();

          if (!data.brandName || data.brandName.trim() === '') {
            if (permissions.canDeleteLeads) {
              const { deleteDoc, doc: fDoc } = require('firebase/firestore');
              deleteDoc(fDoc(db, "leads", d.id)).catch(() => {});
            }
          } else {
            leadsData.push({ id: d.id, ...data } as Lead);
          }
        });
        setLeads(leadsData);
      });

      return unsubLeads;
    });

    let unsubUsers: (() => void) | undefined;
    let unsubApprovals: (() => void) | undefined;
    let unsubTargets: (() => void) | undefined;
    let unsubIndividualTargets: (() => void) | undefined;
    let unsubAuditLogs: (() => void) | undefined;
    let unsubPermissions: (() => void) | undefined;

    // Fetch Role Permissions
    unsubPermissions = onSnapshot(doc(db, "settings", "permissions"), (snap) => {
      if (snap.exists()) {
        setRolePermissions(snap.data() as RolePermissions);
      }
    });

    // Fetch users for all authorized users so they can assign tasks
    unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(d => d.data() as UserProfile));
    });

    unsubTargets = onSnapshot(collection(db, "globalTargets"), (snap) => {
      setTargets(snap.docs.map(d => ({ id: d.id, ...d.data() } as GlobalTarget)));
    });

    unsubIndividualTargets = onSnapshot(collection(db, "individualTargets"), (snap) => {
      setIndividualTargets(snap.docs.map(d => ({ id: d.id, ...d.data() } as IndividualTarget)));
    });

    // Fetch audit logs limited to 48 last entries
    import('firebase/firestore').then(({ query, orderBy, limit }) => {
      const auditQuery = query(collection(db, "globalAuditLogs"), orderBy("timestamp", "desc"), limit(48));
      unsubAuditLogs = onSnapshot(auditQuery, (snap) => {
        setAuditLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog)));
      });
    });

    // Load approvals for users who can approve edits
    if (permissions.canApproveEdits) {
      unsubApprovals = onSnapshot(collection(db, "editRequests"), (snap) => {
        setApprovals(snap.docs.map(d => ({ id: d.id, ...d.data() } as EditRequest)));
      });
    }

    return () => {
      // Clean up listeners
      unsubUsers?.();
      unsubApprovals?.();
      unsubTargets?.();
      unsubIndividualTargets?.();
      unsubAuditLogs?.();
      unsubPermissions?.();
    };
  }, [user, permissions.canDeleteLeads, permissions.canApproveEdits]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      toast.error("Gagal Login: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#4f46e520,transparent_50%)]"></div>
        <div className="relative z-10 flex flex-col items-center">
          <img src="/logo-crm-tnt.png" alt="Logo CRM TNT" className="h-20 object-contain mb-8 animate-pulse drop-shadow-2xl" />
          <h2 className="text-2xl font-black tracking-[0.3em] text-white mb-2">CoreDesk Sales TNT</h2>
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Initializing Enterprise Core...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex items-center justify-center overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,#4f46e510,transparent_40%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_20%_80%,#4f46e510,transparent_40%)]"></div>
        
        <div className="relative z-10 w-full max-w-md px-6">
          <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 text-center">
            <img src="/logo-crm-tnt.png" alt="Logo CRM TNT" className="h-16 object-contain mx-auto mb-8 drop-shadow-xl" />
            
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">CoreDesk Sales TNT</h1>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-12">Sales Intelligence Portal</p>
            
            <button 
              onClick={handleLogin}
              className="group w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-4 shadow-xl shadow-slate-200 active:scale-95"
            >
              <div className="bg-white p-1 rounded-lg">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              </div>
              <span className="text-sm tracking-tight">Sign in with Enterprise Account</span>
            </button>
            
            <div className="mt-12 pt-8 border-t border-slate-50">
              <div className="flex items-center justify-center gap-2 text-slate-400 mb-4">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Secure Cloud Access</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed px-4">
                Access is restricted to authorized personnel. New accounts will require manual verification by the system administrator.
              </p>
            </div>
          </div>
          
          <p className="text-center mt-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
            © 2026 CoreDesk Sales TNT • All Rights Reserved
          </p>
        </div>
        <Toaster position="top-center" richColors />
      </div>
    );
  }

  if (user.role === 'pending') {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#f59e0b10,transparent_50%)]"></div>
        
        <div className="relative z-10 w-full max-w-lg px-6">
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center border border-slate-100">
            <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
              <UserCheck className="w-12 h-12" />
            </div>
            
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Account Verification Required</h2>
            <p className="text-slate-500 font-medium mb-10 leading-relaxed">
              Your account is currently in the <span className="text-amber-600 font-black uppercase tracking-widest text-xs bg-amber-50 px-2 py-1 rounded-md">Pending</span> queue. Please contact the Super Admin to authorize your access to the CoreDesk Sales TNT pipeline.
            </p>
            
            <div className="bg-slate-50 p-6 rounded-2xl text-sm text-slate-500 mb-10 text-left border border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Identity Details</span>
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
              </div>
              <div className="space-y-2">
                <p className="flex justify-between"><span className="font-bold">Full Name:</span> <span className="text-slate-900 font-black">{user.name}</span></p>
                <p className="flex justify-between"><span className="font-bold">Email:</span> <span className="text-slate-900 font-black">{user.email}</span></p>
              </div>
            </div>
            
            <button 
              onClick={() => signOut(auth)}
              className="group text-slate-400 hover:text-red-500 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 mx-auto transition-colors"
            >
              <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Sign Out from Portal
            </button>
          </div>
        </div>
        <Toaster position="top-center" richColors />
      </div>
    );
  }

  // Find active lead if on lead detail route
  const leadIdMatch = location.pathname.match(/^\/lead\/([^/]+)$/);
  const activeLead = leadIdMatch ? leads.find(l => l.id === leadIdMatch[1]) : null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <Sidebar 
        user={user} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        permissions={permissions}
        pendingUsersCount={users.filter(u => u.role === 'pending').length}
        pendingApprovalsCount={approvals.filter(a => a.status === 'pending').length}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 z-10 shrink-0">
          <div className="flex items-center gap-3">
             <img src="/logo-crm-tnt.png" alt="Logo" className="w-8 h-8 object-contain drop-shadow-sm" />
             <h2 className="text-lg font-black tracking-tighter text-slate-900">CoreDesk TNT</h2>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-500 hover:text-indigo-600 bg-slate-50 rounded-lg border border-slate-200 transition focus:outline-none">
             <Menu className="w-5 h-5" />
          </button>
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 flex flex-col overflow-hidden relative"
          >
            <Routes>
              <Route path="/" element={<Dashboard leads={leads} user={user} users={users} targets={targets} individualTargets={individualTargets} />} />
              <Route path="/leads" element={<LeadsTable leads={leads} user={user} users={users} approvals={approvals} />} />
              <Route path="/oi_forecast" element={<OIForecastPage leads={leads} user={user} users={users} />} />
              <Route path="/tasks" element={<Tasks user={user} users={users} />} />
              <Route path="/admin/users" element={permissions.canManageUsers ? <AdminUsers users={users} /> : <Navigate to="/" />} />
              <Route path="/admin/approvals" element={permissions.canApproveEdits ? <AdminApprovals approvals={approvals} leads={leads} /> : <Navigate to="/" />} />
              <Route path="/admin/targets" element={permissions.canSetTargets ? <AdminTargets targets={targets} individualTargets={individualTargets} auditLogs={auditLogs} users={users} user={user} /> : <Navigate to="/" />} />
              <Route path="/permissions" element={user.role === 'lord' ? <PermissionSettings rolePermissions={rolePermissions} /> : <Navigate to="/" />} />
              <Route path="/lead/:id" element={<div className="flex-1 flex flex-col overflow-hidden" />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>

            {/* Render Lead Detail as a fixed overlay when route matches */}
            <AnimatePresence>
              {activeLead && (
                <LeadDetail 
                  lead={activeLead} 
                  user={user} 
                  users={users}
                  onClose={() => {
                    if (window.history.length > 1) {
                      navigate(-1);
                    } else {
                      navigate('/leads');
                    }
                  }} 
                />
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </main>
      
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
