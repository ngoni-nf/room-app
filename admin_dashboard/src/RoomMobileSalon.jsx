import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Scissors, Calendar, DollarSign, User, Star, 
  MessageSquare, Shield, Menu, X, ChevronRight, Clock, 
  CreditCard, CheckCircle, Navigation, Bell, RefreshCw,
  Mail, Lock, Phone, ArrowRight, Map as MapIcon, LogOut
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken,
  updateProfile,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp,
  setDoc,
  getDoc,
  where
} from 'firebase/firestore';

// --- FIREBASE CONFIG & INIT ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'room-app-v2';

// --- ASSETS & UTILS ---
// Fix: We store icon *names* in data, and render components via map to avoid Firestore serialization errors.
const ICON_MAP = {
  'hair': <Scissors size={24} />,
  'nails': <Star size={24} />,
  'barber': <User size={24} />,
  'makeup': <RefreshCw size={24} />, // distinct icon
};

const SERVICES = [
  { id: 'hair', name: 'Signature Cut', iconName: 'hair', price: 350, desc: 'Wash, Cut & Blowdry', color: 'bg-gray-900 text-white' },
  { id: 'barber', name: 'Gents Grooming', iconName: 'barber', price: 200, desc: 'Cut & Beard Trim', color: 'bg-gray-100 text-gray-900' },
  { id: 'nails', name: 'Mani-Pedi', iconName: 'nails', price: 250, desc: 'Gel or Acrylic', color: 'bg-gray-100 text-gray-900' },
  { id: 'makeup', name: 'Event Glam', iconName: 'makeup', price: 450, desc: 'Full Face & Lashes', color: 'bg-gray-100 text-gray-900' },
];

const MOCK_STAFF = [
  { id: 's1', lat: 45, lng: 30, status: 'busy' },
  { id: 's2', lat: 60, lng: 60, status: 'available' },
  { id: 's3', lat: 20, lng: 80, status: 'available' },
];

// --- COMPONENTS ---

const Button = ({ children, onClick, variant = "primary", className = "", disabled = false, icon: Icon }) => {
  const base = "w-full py-4 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-3 text-sm tracking-wide";
  const variants = {
    primary: "bg-black text-white shadow-xl shadow-gray-200",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    outline: "border-2 border-gray-200 text-gray-600 hover:border-black hover:text-black",
    ghost: "bg-transparent text-gray-500 hover:text-black"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className} ${disabled ? 'opacity-50' : ''}`}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

const Input = ({ label, type = "text", value, onChange, placeholder, icon: Icon }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{label}</label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
        {Icon && <Icon size={20} />}
      </div>
      <input 
        type={type} 
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 pl-12 pr-4 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all placeholder-gray-400"
      />
    </div>
  </div>
);

const MapBackground = ({ active = false, userType = 'client' }) => (
  <div className="fixed inset-0 z-0 bg-gray-100 pointer-events-none">
    {/* Abstract Map Elements */}
    <div className="absolute inset-0 opacity-[0.07]" 
         style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
    </div>
    
    {/* Simulated Roads/Blocks */}
    <div className="absolute top-0 left-1/3 w-px h-full bg-gray-300/50"></div>
    <div className="absolute top-1/3 left-0 w-full h-px bg-gray-300/50"></div>
    <div className="absolute top-2/3 left-0 w-full h-px bg-gray-300/50"></div>
    
    {/* Animated Staff Dots (Uber style) */}
    {userType === 'client' && MOCK_STAFF.map((s, i) => (
      <div key={s.id} 
           className="absolute transition-all duration-[3000ms] ease-linear"
           style={{ 
             top: `${s.lat + (active ? Math.random() * 10 : 0)}%`, 
             left: `${s.lng + (active ? Math.random() * 10 : 0)}%` 
           }}>
        <div className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center transform -rotate-45">
          <Scissors size={14} className="text-black" />
        </div>
      </div>
    ))}

    {/* User Location */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="relative">
        <div className="w-4 h-4 bg-black rounded-full shadow-xl border-2 border-white z-10 relative"></div>
        <div className="w-16 h-16 bg-black/10 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping"></div>
      </div>
      <div className="absolute mt-4 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg whitespace-nowrap">
        5 min pickup
      </div>
    </div>
  </div>
);

// 4. Main Application
export default function RoomApp() {
  // Auth State
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authStep, setAuthStep] = useState('landing'); // landing, login, register
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', role: 'client' });
  
  // App State
  const [view, setView] = useState('loading'); // loading, home, booking, requesting, active-job, staff-dash
  const [selectedService, setSelectedService] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);
  const [requestsQueue, setRequestsQueue] = useState([]); // For staff
  
  // --- AUTH & INIT ---
  useEffect(() => {
    const init = async () => {
      // Check for existing session
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        // Wait for user interaction to sign in anonymously for "Guest" flow, 
        // but we will do it on mount for stability in this environment
        await signInAnonymously(auth); 
      }
    };
    init();

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        // Fetch Profile
        const docRef = doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'main');
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
          const profile = snap.data();
          setUserProfile(profile);
          setView(profile.role === 'staff' ? 'staff-dash' : 'home');
          setAuthStep('authed');
        } else {
          // No profile found -> User needs to "Register" (even if anon auth exists)
          setView('auth');
          setAuthStep('landing');
        }
      }
    });
    return () => unsub();
  }, []);

  // --- REALTIME LISTENERS ---
  useEffect(() => {
    if (!user || !userProfile) return;

    // 1. Listen for Active Requests relating to ME
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'requests'));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const allReqs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      if (userProfile.role === 'client') {
        // Client Logic: Am I currently in a service?
        const myActive = allReqs.find(r => r.clientId === user.uid && r.status !== 'completed' && r.status !== 'cancelled');
        setActiveRequest(myActive || null);
        if (myActive && view !== 'active-job') setView('active-job');
      } else {
        // Staff Logic: See available queue OR my current job
        const myJob = allReqs.find(r => r.assignedStaffId === user.uid && r.status !== 'completed');
        setActiveRequest(myJob || null);
        
        // Queue is pending requests
        const pending = allReqs.filter(r => r.status === 'pending');
        setRequestsQueue(pending);

        if (myJob) setView('active-job');
      }
    });

    return () => unsub();
  }, [user, userProfile]);

  // --- HANDLERS ---

  const handleRegister = async () => {
    if (!formData.name || !formData.phone) return;
    
    // In a real app, we'd use createUserWithEmailAndPassword here.
    // Since we are restricted to anon/custom tokens, we just attach the profile to the current uid.
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role, // 'client' or 'staff'
        joinedAt: serverTimestamp()
      });
      // Trigger state update manually to speed up UI
      setUserProfile({ ...formData, uid: user.uid });
      setView(formData.role === 'staff' ? 'staff-dash' : 'home');
    } catch (e) {
      console.error("Registration failed", e);
    }
  };

  const handleLoginMock = async () => {
    // Simulating a login by checking if profile exists (it won't in this fresh env usually)
    // For demo purposes, we just "Register" them if they try to login, or show error
    alert("For this demo, please use 'Sign Up' to create a fresh profile.");
    setAuthStep('register');
  };

  const handleRequestService = async () => {
    if (!selectedService || !user) return;
    setView('requesting'); // Show spinner
    
    // Serialize service object (remove React component)
    const safeService = {
        id: selectedService.id,
        name: selectedService.name,
        price: selectedService.price,
        iconName: selectedService.iconName
    };

    try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'requests'), {
            clientId: user.uid,
            clientName: userProfile.name,
            clientPhone: userProfile.phone,
            service: safeService,
            status: 'pending',
            timestamp: serverTimestamp(),
            location: 'Current Location', // In real app, use Geolocation API
            price: selectedService.price,
            paymentMethod: 'card' // Defaulting to card for Uber-like flow
        });
        // Listener will switch view to active-job when picked up or acknowledged
        // For now, we wait in 'requesting' or go to a 'searching' state
        setTimeout(() => setView('active-job'), 2000); // Fallback for demo if listener is slow
    } catch (e) {
        console.error("Booking Error:", e);
        setView('home');
    }
  };

  const handleAcceptJob = async (reqId) => {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', reqId), {
          status: 'accepted',
          assignedStaffId: user.uid,
          staffName: userProfile.name,
          staffEta: '8 mins'
      });
  };

  const handleStatusUpdate = async (status) => {
      if (!activeRequest) return;
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'requests', activeRequest.id), {
          status: status
      });
      if (status === 'completed') {
          setView(userProfile.role === 'staff' ? 'staff-dash' : 'home');
          setActiveRequest(null);
      }
  };

  // --- VIEWS ---

  const AuthScreens = () => (
    <div className="h-full flex flex-col bg-white p-8 pt-20">
      <div className="mb-12">
        <h1 className="text-6xl font-black tracking-tighter mb-4">Room.</h1>
        <p className="text-xl text-gray-500 font-medium">The mobile salon company.</p>
      </div>

      {authStep === 'landing' && (
        <div className="mt-auto space-y-4">
           <Button onClick={() => setAuthStep('register')} icon={ArrowRight}>Get Started</Button>
           <Button variant="ghost" onClick={() => setAuthStep('login')}>I have an account</Button>
           <div className="pt-8 text-center">
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-4">Internal Staff</p>
              <button onClick={() => { setFormData({...formData, role: 'staff'}); setAuthStep('register'); }} className="text-xs font-bold underline">Register as Stylist</button>
           </div>
        </div>
      )}

      {authStep === 'register' && (
        <div className="flex-1 flex flex-col space-y-6 animate-in slide-in-from-bottom-10 duration-500">
          <div className="mb-4">
             <h2 className="text-2xl font-bold">{formData.role === 'staff' ? 'Staff Application' : 'Create Profile'}</h2>
             <p className="text-gray-500 text-sm">Enter your details to verify identity.</p>
          </div>
          
          <Input icon={User} label="Full Name" placeholder="e.g. Jane Doe" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
          <Input icon={Mail} label="Email Address" placeholder="name@example.com" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
          <Input icon={Phone} label="Mobile Number" placeholder="+1 234 567 890" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} />
          
          <div className="mt-auto pt-6">
             <Button onClick={handleRegister}>Create Account</Button>
             <Button variant="ghost" onClick={() => setAuthStep('landing')} className="mt-2">Cancel</Button>
          </div>
        </div>
      )}

      {authStep === 'login' && (
        <div className="flex-1 flex flex-col space-y-6 animate-in slide-in-from-bottom-10 duration-500">
          <h2 className="text-2xl font-bold">Welcome Back</h2>
          <Input icon={Mail} label="Email" placeholder="name@example.com" value={formData.email} onChange={v => setFormData({...formData, email: v})} />
          <Input icon={Lock} type="password" label="Password" placeholder="••••••••" value="" onChange={() => {}} />
          
          <div className="mt-auto pt-6">
             <Button onClick={handleLoginMock}>Sign In</Button>
             <Button variant="ghost" onClick={() => setAuthStep('landing')} className="mt-2">Back</Button>
          </div>
        </div>
      )}
    </div>
  );

  const ClientHome = () => (
    <div className="h-full relative flex flex-col">
       <MapBackground active={true} />
       
       {/* Top Bar */}
       <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10">
          <button className="bg-white/90 backdrop-blur p-3 rounded-full shadow-lg">
            <Menu size={24} />
          </button>
          <div className="bg-black text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 text-sm font-bold">
            <Star size={14} className="text-yellow-400 fill-current" />
            4.9 Rating
          </div>
       </div>

       {/* Bottom Sheet */}
       <div className="mt-auto bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-10 animate-in slide-in-from-bottom-20 duration-500">
         <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mt-4 mb-2"></div>
         
         {!selectedService ? (
           <div className="p-6">
             <h3 className="text-xl font-bold mb-6 text-gray-900">What are we doing today?</h3>
             <div className="space-y-3 max-h-[60vh] overflow-y-auto pb-10">
                {SERVICES.map(s => (
                   <div 
                     key={s.id} 
                     onClick={() => setSelectedService(s)}
                     className="group flex items-center gap-4 p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer active:scale-95"
                   >
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-sm transition-colors ${s.color} group-hover:bg-black group-hover:text-white`}>
                         {ICON_MAP[s.iconName]}
                      </div>
                      <div className="flex-1">
                         <h4 className="font-bold text-lg">{s.name}</h4>
                         <p className="text-gray-500 text-sm">{s.desc}</p>
                      </div>
                      <div className="font-bold text-lg">${s.price}</div>
                   </div>
                ))}
             </div>
           </div>
         ) : (
           // Confirmation State
           <div className="p-6">
              <div className="flex items-center gap-4 mb-8">
                 <button onClick={() => setSelectedService(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={24}/></button>
                 <h3 className="text-xl font-bold">Confirm Service</h3>
              </div>

              <div className="flex items-center gap-4 mb-8 bg-gray-50 p-4 rounded-2xl">
                 <div className="w-16 h-16 bg-black text-white rounded-xl flex items-center justify-center shadow-lg">
                    {ICON_MAP[selectedService.iconName]}
                 </div>
                 <div>
                    <h4 className="font-bold text-xl">{selectedService.name}</h4>
                    <p className="text-gray-500">Room Mobile Staff</p>
                 </div>
                 <div className="ml-auto font-bold text-2xl">${selectedService.price}</div>
              </div>

              <div className="flex justify-between items-center mb-6 text-sm font-medium text-gray-500">
                 <div className="flex items-center gap-2">
                   <CreditCard size={16} />
                   <span>Visa ending 4242</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <Clock size={16} />
                   <span>~45 mins</span>
                 </div>
              </div>

              <Button onClick={handleRequestService} variant="primary">
                 Request Room Pro
              </Button>
           </div>
         )}
       </div>
    </div>
  );

  const StaffDashboard = () => (
    <div className="h-full bg-gray-50 flex flex-col">
       {/* Header */}
       <div className="bg-black text-white p-6 pt-12 pb-8 rounded-b-3xl shadow-xl">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-2xl font-bold">Room Staff</h2>
             <div className="bg-green-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                ONLINE
             </div>
          </div>
          <div className="flex justify-between text-center">
             <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Earnings</p>
                <p className="text-2xl font-bold">$850</p>
             </div>
             <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Trips</p>
                <p className="text-2xl font-bold">4</p>
             </div>
             <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Rating</p>
                <p className="text-2xl font-bold">5.0</p>
             </div>
          </div>
       </div>

       <div className="flex-1 p-6 overflow-y-auto">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
             Job Queue 
             <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">{requestsQueue.length}</span>
          </h3>

          {requestsQueue.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white rounded-3xl border border-gray-100 border-dashed">
                <MapPin size={48} className="mb-4 opacity-20" />
                <p>Finding nearby requests...</p>
             </div>
          ) : (
             <div className="space-y-4">
                {requestsQueue.map(req => (
                   <div key={req.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                      <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                               {ICON_MAP[req.service.iconName]}
                            </div>
                            <div>
                               <h4 className="font-bold">{req.service.name}</h4>
                               <p className="text-xs text-gray-500">{req.clientName}</p>
                            </div>
                         </div>
                         <div className="font-bold text-lg">${req.service.price}</div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-6 bg-gray-50 p-3 rounded-lg">
                         <Navigation size={16} />
                         <span className="truncate">{req.location || '2.4km away • 15 min drive'}</span>
                      </div>

                      <Button onClick={() => handleAcceptJob(req.id)}>Accept Job</Button>
                   </div>
                ))}
             </div>
          )}
       </div>
    </div>
  );

  const ActiveJobView = () => {
    if (!activeRequest) return null;
    const isStaff = userProfile.role === 'staff';
    
    return (
      <div className="h-full flex flex-col relative bg-gray-100">
         <MapBackground active={true} userType={userProfile.role} />
         
         {/* Status Overlay */}
         <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent text-white pt-10">
            <div className="flex justify-between items-center">
               <h2 className="font-bold text-xl drop-shadow-md">
                  {activeRequest.status === 'pending' ? 'Matching...' : 
                   activeRequest.status === 'accepted' ? 'Driver En Route' : 
                   activeRequest.status === 'in_progress' ? 'Service Started' : 'Wrapping Up'}
               </h2>
               {activeRequest.status === 'accepted' && <div className="bg-white text-black font-bold px-3 py-1 rounded-full text-sm shadow-lg">8 min</div>}
            </div>
         </div>

         {/* Bottom Interaction Panel */}
         <div className="mt-auto bg-white rounded-t-3xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] z-20">
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6"></div>

            <div className="flex items-center gap-4 mb-8">
               <div className="w-16 h-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center">
                  {ICON_MAP[activeRequest.service.iconName]}
               </div>
               <div className="flex-1">
                  <h3 className="font-bold text-xl">{activeRequest.service.name}</h3>
                  <p className="text-gray-500 text-sm">
                     {isStaff ? `Client: ${activeRequest.clientName}` : `Stylist: ${activeRequest.staffName || 'Connecting...'}`}
                  </p>
               </div>
               <div className="flex gap-2">
                  <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><Phone size={18}/></button>
                  <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><MessageSquare size={18}/></button>
               </div>
            </div>

            {/* Timeline / Actions */}
            <div className="space-y-3">
               {isStaff ? (
                  <>
                     {activeRequest.status === 'accepted' && (
                        <Button onClick={() => handleStatusUpdate('in_progress')} variant="primary" icon={Navigation}>
                           Arrived & Start Service
                        </Button>
                     )}
                     {activeRequest.status === 'in_progress' && (
                        <Button onClick={() => handleStatusUpdate('completed')} variant="primary" className="bg-green-600 hover:bg-green-700 border-transparent" icon={CheckCircle}>
                           Complete Job & Collect Payment
                        </Button>
                     )}
                  </>
               ) : (
                  <>
                     {activeRequest.status === 'pending' && (
                        <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-center font-medium animate-pulse">
                           Finding the nearest stylist...
                        </div>
                     )}
                     {activeRequest.status === 'accepted' && (
                        <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                           <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" className="w-10 h-10 rounded-full bg-white border" />
                           <div className="text-sm">
                              <p className="font-bold">{activeRequest.staffName} is on the way.</p>
                              <p className="text-gray-500">White Toyota Camry • JX 88 MP GP</p>
                           </div>
                        </div>
                     )}
                     <Button variant="outline" className="mt-2 text-red-500 border-red-100 hover:border-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleStatusUpdate('cancelled')}>
                        Cancel Request
                     </Button>
                  </>
               )}
            </div>
         </div>
      </div>
    );
  }

  // --- MAIN RENDER ---
  return (
    <div className="h-screen w-full bg-black flex justify-center items-center">
      <div className="w-full max-w-md bg-white h-full sm:h-[90vh] sm:rounded-[3rem] relative shadow-2xl overflow-hidden flex flex-col font-sans sm:border-[8px] sm:border-gray-900">
        
        {view === 'loading' && (
           <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
           </div>
        )}
        
        {view === 'auth' && <AuthScreens />}
        {view === 'home' && <ClientHome />}
        {view === 'staff-dash' && <StaffDashboard />}
        {(view === 'requesting' || view === 'active-job') && <ActiveJobView />}
        
      </div>
    </div>
  );
}
