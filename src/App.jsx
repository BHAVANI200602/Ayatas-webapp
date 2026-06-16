import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Check, 
  MapPin, 
  Scissors, 
  Eye as LashIcon, 
  Sparkles, 
  Sparkle, 
  Flame, 
  Droplet, 
  PenTool, 
  Sun, 
  Dumbbell, 
  Activity, 
  PlusCircle, 
  Grid, 
  User, 
  Users, 
  Globe, 
  Phone, 
  Building2, 
  LogOut, 
  ExternalLink 
} from "lucide-react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";

function OnboardingHeader({
  currentStep,
  onBack,
  onRightAction,
  rightActionDisabled = false,
  rightActionText = "Continue",
  rightActionIcon,
  rightCloseAction,
  isLoading = false
}) {
  return (
    <div className="border-b border-neutral-100 bg-white">
      {/* Progress Bar at the very top */}
      <div className="flex gap-1.5 w-full pt-1.5 px-4 sm:px-8 mx-auto max-w-[1200px]">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              s <= currentStep ? "bg-violet-600" : "bg-neutral-150"
            }`}
          ></div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
        {/* Left Slot: Back Button */}
        <div className="w-12 flex items-center justify-start shrink-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-10 h-10 border border-neutral-200 rounded-full flex items-center justify-center hover:bg-neutral-50 cursor-pointer transition-all"
            >
              <ArrowLeft size={16} className="text-neutral-700" />
            </button>
          )}
        </div>

        {/* Empty Center Slot to push Right Slot to the edge */}
        <div className="flex-1"></div>

        {/* Right Slot: Close/Continue Button */}
        <div className="flex items-center justify-end gap-2 shrink-0 min-w-[70px] sm:min-w-[120px]">
          {rightCloseAction && (
            <button
              type="button"
              onClick={rightCloseAction}
              className="text-neutral-500 hover:text-neutral-800 font-bold text-sm px-3 py-2 cursor-pointer transition-all"
            >
              Close
            </button>
          )}
          {onRightAction && (
            <button
              type="button"
              onClick={onRightAction}
              disabled={rightActionDisabled || isLoading}
              className={`py-2 px-4 sm:px-5 rounded-full font-bold flex items-center gap-1.5 text-xs sm:text-sm transition-all shadow-sm ${
                rightActionDisabled || isLoading
                  ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                  : "bg-neutral-950 text-white cursor-pointer hover:bg-neutral-800"
              }`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {rightActionText}
                  {rightActionIcon}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState("welcome");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");
  const [mobileNumber, setMobileNumber] = useState("");
  const [country, setCountry] = useState("India");
  const [agree, setAgree] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [website, setWebsite] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [accountType, setAccountType] = useState("independent");
  const [serviceLocation, setServiceLocation] = useState("physical");
  const [address, setAddress] = useState("Kirampudi Layout, Chinna Waltair Main Road, Visakhapatnam (Pedda Waltair), Andhra Pradesh, India");
  const [marketingSource, setMarketingSource] = useState("");
  const [config, setConfig] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [authError, setAuthError] = useState("");
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [mapZoom, setMapZoom] = useState(15);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [isDraggingMap, setIsDraggingMap] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        setConfig(data);
        
        if (!data.useLocalOnly) {
          let app;
          if (!getApps().length) {
            app = initializeApp(data.firebase);
          } else {
            app = getApp();
          }
          const auth = getAuth(app);
          const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
              setEmail(user.email || "");
              await fetchProfile(user.email);
              setLoadingConfig(false);
            } else {
              setLoadingConfig(false);
            }
          });
          return () => unsubscribe();
        } else {
          setLoadingConfig(false);
        }
      })
      .catch(() => {
        setLoadingConfig(false);
      });
  }, []);

  const handleWelcomeSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setEmailError("This field is required");
      return;
    }
    setEmailError("");
    setStep("signup");
  };

  const handleRegisterAuth = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !password || !mobileNumber || !agree) {
      return;
    }
    setIsLoading(true);
    setAuthError("");

    if (config && !config.useLocalOnly) {
      try {
        const app = getApp();
        const authInstance = getAuth(app);
        
        // Skip email/password auth if already signed in via Google
        if (!authInstance.currentUser) {
          try {
            await createUserWithEmailAndPassword(authInstance, email, password);
          } catch (err) {
            if (err.code !== "auth/email-already-in-use") {
              setIsLoading(false);
              setAuthError(err.message || "Registration failed");
              return;
            } else {
              try {
                await signInWithEmailAndPassword(authInstance, email, password);
              } catch (loginErr) {
                setIsLoading(false);
                setAuthError("Email is already taken. Please try logging in instead.");
                return;
              }
            }
          }
        }
      } catch (globalAuthErr) {
        setIsLoading(false);
        setAuthError(globalAuthErr.message || "Authentication initialization failed");
        return;
      }
    }
    setIsLoading(false);
    setStep("biz_name");
  };

  const toggleCategory = (catId) => {
    const isAlreadySelected = selectedCategories.find((c) => c.id === catId);
    if (isAlreadySelected) {
      const removedRank = isAlreadySelected.rank;
      const updated = selectedCategories
        .filter((c) => c.id !== catId)
        .map((c) => {
          if (c.rank > removedRank) {
            return { ...c, rank: c.rank - 1 };
          }
          return c;
        });
      setSelectedCategories(updated);
    } else {
      if (selectedCategories.length >= 4) {
        return;
      }
      setSelectedCategories([
        ...selectedCategories,
        { id: catId, rank: selectedCategories.length + 1 }
      ]);
    }
  };

  const handleDone = async () => {
    setIsLoading(true);
    const sortedCategories = [...selectedCategories]
      .sort((a, b) => a.rank - b.rank)
      .map((c) => c.id);
    const primary = sortedCategories[0] || "Other";

    const payload = {
      email,
      firstName,
      lastName,
      mobileNumber: countryCode + mobileNumber,
      countryCode,
      country,
      businessName,
      website,
      categories: sortedCategories,
      primaryCategory: primary,
      accountType,
      serviceLocation,
      address,
      marketingSource
    };

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const resData = await response.json();
      if (resData.success) {
        fetchProfile(email);
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      setIsLoading(false);
    }
  };

  const fetchProfile = async (targetEmail) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(targetEmail)}`);
      const resData = await res.json();
      if (resData.data) {
        setCurrentUser(resData.data);
        setStep("profile");
      } else {
        setStep("signup");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (config && !config.useLocalOnly) {
      try {
        const app = getApp();
        const authInstance = getAuth(app);
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(authInstance, provider);
        if (result.user) {
          setEmail(result.user.email || "");
          if (result.user.displayName) {
             const parts = result.user.displayName.split(" ");
             setFirstName(parts[0] || "");
             setLastName(parts.slice(1).join(" ") || "");
          }
          await fetchProfile(result.user.email);
        }
      } catch (err) {
        console.error("Google login error", err);
      }
    }
  };

  const handleLogout = async () => {
    if (config && !config.useLocalOnly) {
      try {
        const app = getApp();
        const auth = getAuth(app);
        await signOut(auth);
      } catch (err) {
        console.error("Logout error", err);
      }
    }
    setStep("welcome");
    setEmail("");
    setFirstName("");
    setLastName("");
    setPassword("");
    setMobileNumber("");
    setBusinessName("");
    setWebsite("");
    setSelectedCategories([]);
    setAccountType("independent");
    setServiceLocation("physical");
    setMarketingSource("");
    setCurrentUser(null);
  };

  const handleMouseDown = (e) => {
    setIsDraggingMap(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDraggingMap) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setMapOffset({ x: mapOffset.x + dx, y: mapOffset.y + dy });
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDraggingMap(false);
  };

  const categoriesList = [
    { id: "Hair salon", icon: Scissors },
    { id: "Nails", icon: Sparkles },
    { id: "Eyebrows & lashes", icon: LashIcon },
    { id: "Beauty salon", icon: Sparkle },
    { id: "Medspa", icon: Sparkles },
    { id: "Barber", icon: Scissors },
    { id: "Massage", icon: Sparkles },
    { id: "Spa & sauna", icon: Flame },
    { id: "Waxing salon", icon: Droplet },
    { id: "Tattooing & piercing", icon: PenTool },
    { id: "Tanning studio", icon: Sun },
    { id: "Fitness & recovery", icon: Dumbbell },
    { id: "Physical therapy", icon: Activity },
    { id: "Health practice", icon: PlusCircle },
    { id: "Pet grooming", icon: Sparkles },
    { id: "Other", icon: Grid }
  ];

  if (loadingConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (step === "profile" && currentUser) {
    return (
      <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-neutral-200/80 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-violet-600 to-indigo-700 px-8 py-10 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-sm mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Connected to Supabase
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                {currentUser.firstName} {currentUser.lastName}
              </h1>
              <p className="text-violet-100 mt-1">{currentUser.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white text-violet-700 hover:bg-neutral-100 font-bold tracking-tight transition-all text-sm shadow-md"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-150">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">
                  Account details
                </h3>
                <div className="space-y-3.5">
                  <div className="flex items-center gap-3 text-neutral-800">
                    <Phone className="text-violet-500 shrink-0" size={18} />
                    <span>{currentUser.mobileNumber}</span>
                  </div>
                  <div className="flex items-center gap-3 text-neutral-800">
                    <Globe className="text-violet-500 shrink-0" size={18} />
                    <span>{currentUser.country}</span>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-150">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">
                  Business parameters
                </h3>
                <div className="space-y-3.5">
                  <div className="flex items-center gap-3 text-neutral-800">
                    <Building2 className="text-violet-500 shrink-0" size={18} />
                    <span className="font-semibold">{currentUser.businessName}</span>
                  </div>
                  {currentUser.website && (
                    <div className="flex items-center gap-3 text-neutral-800">
                      <ExternalLink className="text-violet-500 shrink-0" size={18} />
                      <a href={`https://${currentUser.website}`} target="_blank" rel="noreferrer" className="text-violet-600 hover:underline">
                        {currentUser.website}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-neutral-800">
                    <User className="text-violet-500 shrink-0" size={18} />
                    <span className="capitalize">{currentUser.accountType}</span>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-150">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
                  How you heard about us
                </h3>
                <span className="inline-block bg-violet-50 text-violet-800 font-medium px-4 py-1.5 rounded-full border border-violet-100 text-sm">
                  {currentUser.marketingSource || "Not Specified"}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-150">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">
                  Categories
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-medium text-neutral-400">Primary</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1.5 bg-violet-600 text-white font-bold px-3 py-1.5 rounded-xl text-sm">
                        <Check size={14} />
                        {currentUser.primaryCategory}
                      </span>
                    </div>
                  </div>
                  {currentUser.categories && currentUser.categories.length > 1 && (
                    <div className="mt-4">
                      <span className="text-xs font-medium text-neutral-400">Subcategories</span>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {currentUser.categories.slice(1).map((cat) => (
                          <span key={cat} className="bg-neutral-200/75 text-neutral-700 font-medium px-3 py-1 rounded-lg text-xs">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-150">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
                  Delivery Venue
                </h3>
                <span className="inline-block bg-indigo-50 text-indigo-700 font-semibold px-3 py-1 rounded-lg text-xs mb-3 capitalize">
                  {currentUser.serviceLocation === "physical" ? "Clients come to my location" : currentUser.serviceLocation === "mobile" ? "Mobile operator" : "Virtual services only"}
                </span>
                <div className="flex items-start gap-2.5 text-neutral-700 bg-white p-3 rounded-xl border border-neutral-100 text-sm">
                  <MapPin className="text-rose-500 shrink-0 mt-0.5" size={16} />
                  <span>{currentUser.address}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {step === "welcome" && (
        <div className="min-h-screen flex flex-col md:flex-row">
          <div className="w-full md:w-[50%] flex flex-col justify-between py-12 px-6 sm:px-12 md:px-16 lg:px-24">
            <div></div>
            <div className="max-w-[420px] w-full mx-auto space-y-8">
              <div className="space-y-3">
                <h2 className="text-[32px] md:text-[38px] font-bold text-neutral-900 tracking-tight leading-tight">
                  Signup as professionals
                </h2>
                <p className="text-neutral-500 text-base leading-relaxed">
                  Create an account or log in to manage your business.
                </p>
              </div>

              <form onSubmit={handleWelcomeSubmit} className="space-y-4">
                <div className="space-y-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (e.target.value) setEmailError("");
                    }}
                    placeholder="Enter your email address"
                    className={`w-full px-4 py-3.5 border rounded-xl outline-none focus:border-neutral-900 transition-all ${
                      emailError ? "border-rose-500" : "border-neutral-200"
                    }`}
                  />
                  {emailError && (
                    <p className="text-rose-600 text-sm font-medium">{emailError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-full bg-neutral-950 text-white font-bold hover:bg-neutral-800 transition-all text-center flex items-center justify-center cursor-pointer"
                >
                  Continue
                </button>
              </form>

              <div className="relative my-8 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-150"></div>
                </div>
                <span className="relative bg-white px-4 text-xs font-bold text-neutral-400 tracking-widest uppercase">
                  or
                </span>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => { setEmail("facebook-demo@example.com"); setStep("signup"); }}
                  className="w-full py-3.5 px-5 border border-neutral-200 rounded-full bg-white flex items-center justify-center gap-3 hover:bg-neutral-50 transition-all text-neutral-800 font-semibold cursor-pointer text-sm"
                >
                  <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Continue with Facebook
                </button>

                <button 
                  onClick={handleGoogleLogin}
                  type="button"
                  className="w-full py-3.5 px-5 border border-neutral-200 rounded-full bg-white flex items-center justify-center gap-3 hover:bg-neutral-50 transition-all text-neutral-800 font-semibold cursor-pointer text-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.29 1.5-1.14 2.77-2.4 3.63v3.02h3.86c2.26-2.08 3.56-5.14 3.56-8.5z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.86-3.02c-1.08.72-2.45 1.16-4.1 1.16-3.15 0-5.83-2.13-6.78-5.01H1.32v3.11c2 3.97 6.11 6.66 10.68 6.66z"/>
                    <path fill="#FBBC05" d="M5.22 14.22c-.24-.72-.38-1.5-.38-2.3a8.12 8.12 0 01.38-2.3V6.51H1.32A11.94 11.94 0 000 12c0 1.92.45 3.74 1.32 5.37l3.9-3.15z"/>
                    <path fill="#EA4335" d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.96 1.19 15.24 0 12 0 7.43 0 3.32 2.69 1.32 6.51l3.9 3.15c.95-2.88 3.63-5.01 6.78-5.01z"/>
                  </svg>
                  Continue with Google
                </button>

                <button 
                  onClick={() => { setEmail("apple-demo@example.com"); setStep("signup"); }}
                  className="w-full py-3.5 px-5 border border-neutral-200 rounded-full bg-white flex items-center justify-center gap-3 hover:bg-neutral-50 transition-all text-neutral-800 font-semibold cursor-pointer text-sm"
                >
                  <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.05-1 .04-2.1.67-2.82 1.5-.64.72-1.19 1.86-1.04 2.97 1.1.09 2.1-.55 2.87-1.42z"/>
                  </svg>
                  Continue with Apple
                </button>
              </div>

              <div className="space-y-1 text-center pt-2">
                <p className="text-neutral-500 text-xs font-medium">Are you a customer looking to book an appointment?</p>
                <button type="button" className="text-violet-600 font-bold text-xs hover:underline cursor-pointer">
                  Go to Ayatas for customers
                </button>
              </div>
            </div>
            <div></div>
          </div>

          <div className="hidden md:block w-[50%] relative overflow-hidden bg-neutral-100">
            <img
              src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1000"
              alt="Professional setting"
              className="absolute inset-0 w-full h-full object-cover object-center scale-102 filter brightness-95"
            />
          </div>
        </div>
      )}

      {step === "signup" && (
        <div className="min-h-screen flex flex-col md:flex-row">
          <div className="w-full md:w-[50%] flex flex-col justify-between py-12 px-6 sm:px-12 md:px-16 lg:px-24">
            <div className="flex items-center">
              <button 
                onClick={() => setStep("welcome")}
                className="w-10 h-10 border border-neutral-200 rounded-full flex items-center justify-center hover:bg-neutral-50 cursor-pointer"
              >
                <ArrowLeft size={16} />
              </button>
            </div>

            <div className="max-w-[420px] w-full mx-auto space-y-6 py-6">
              <div className="space-y-2">
                <h2 className="text-[28px] md:text-[34px] font-bold text-neutral-900 tracking-tight leading-tight">
                  Create a professional account
                </h2>
                <p className="text-neutral-500 text-sm leading-relaxed">
                  You're almost there! Create your new account for <strong className="text-neutral-800">{email}</strong> by completing these details
                </p>
              </div>

              {authError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-lg text-sm font-medium">
                  {authError}
                </div>
              )}

              <form onSubmit={handleRegisterAuth} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-800">First name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl outline-none focus:border-neutral-900 transition-all text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-800">Last name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl outline-none focus:border-neutral-950 transition-all text-sm"
                  />
                </div>

                <div className="space-y-1 relative">
                  <label className="text-xs font-bold text-neutral-800">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter a password"
                      className="w-full pl-4 pr-10 py-3 border border-neutral-200 rounded-xl outline-none focus:border-neutral-900 transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-800">Mobile number</label>
                  <div className="flex gap-2.5">
                    <div className="relative shrink-0">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="appearance-none bg-white pl-4 pr-8 py-3 border border-neutral-200 rounded-xl outline-none text-sm font-semibold cursor-pointer"
                      >
                        <option value="+91">+91</option>
                        <option value="+1">+1</option>
                        <option value="+44">+44</option>
                        <option value="+971">+971</option>
                        <option value="+61">+61</option>
                      </select>
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                        ▼
                      </div>
                    </div>
                    <input
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="Enter your mobile number"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl outline-none focus:border-neutral-900 transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-800">Country</label>
                  <div className="flex items-center justify-between px-4 py-3 border border-neutral-200 rounded-xl bg-white text-sm">
                    <span className="text-neutral-800">{country}</span>
                    <button
                      type="button"
                      onClick={() => setCountry(country === "India" ? "United States" : "India")}
                      className="text-violet-600 font-semibold cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                <label className="flex items-start gap-3 pt-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-violet-600 rounded text-white"
                  />
                  <span className="text-xs text-neutral-500 leading-normal">
                    I agree to the <span className="text-violet-600 font-semibold underline">Privacy Policy</span>, <span className="text-violet-600 font-semibold underline">Terms of Service</span> and <span className="text-violet-600 font-semibold underline">Terms of Business</span>.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 rounded-full bg-neutral-950 text-white font-bold hover:bg-neutral-800 transition-all text-center flex items-center justify-center cursor-pointer mt-4"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Create account"
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <p className="text-[10px] text-neutral-400">
                  This site is protected by reCAPTCHA Google Privacy Policy and Terms of Service apply
                </p>
              </div>
            </div>
            <div></div>
          </div>

          <div className="hidden md:block w-[50%] relative overflow-hidden bg-neutral-100">
            <img
              src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1000"
              alt="Professional setting"
              className="absolute inset-0 w-full h-full object-cover object-center scale-102 filter brightness-95"
            />
          </div>
        </div>
      )}

      {step === "biz_name" && (
        <div className="min-h-screen flex flex-col bg-white">
          <OnboardingHeader
            currentStep={1}
            onRightAction={() => {
              if (businessName) setStep("categories");
            }}
            rightActionDisabled={!businessName}
            rightActionIcon={<ArrowRight size={14} />}
          />

          <div className="flex-1 max-w-[540px] w-full mx-auto px-6 py-16 flex flex-col justify-center space-y-8">
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Account setup</span>
              <h2 className="text-[32px] md:text-[38px] font-bold text-neutral-900 tracking-tight leading-tight">
                What's your business name?
              </h2>
              <p className="text-neutral-500 text-sm leading-relaxed">
                This is the brand name your clients will see. Your billing and legal name can be added later.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-800">Business name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Enter business name"
                  className="w-full px-4 py-3.5 border border-neutral-200 rounded-xl outline-none focus:border-neutral-950 transition-all text-sm"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-neutral-800">Website <span className="text-neutral-400 font-normal">(Optional)</span></label>
                </div>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="www.yoursite.com"
                  className="w-full px-4 py-3.5 border border-neutral-200 rounded-xl outline-none focus:border-neutral-950 transition-all text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {step === "categories" && (
        <div className="min-h-screen flex flex-col bg-white">
          <OnboardingHeader
            currentStep={2}
            onBack={() => setStep("biz_name")}
            onRightAction={() => {
              if (selectedCategories.length > 0) setStep("account_type");
            }}
            rightActionDisabled={selectedCategories.length === 0}
            rightActionIcon={<ArrowRight size={14} />}
          />

          <div className="flex-1 max-w-[1020px] w-full mx-auto px-6 py-12 space-y-8 flex flex-col justify-center">
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Account setup</span>
              <h2 className="text-[28px] md:text-[34px] font-bold text-neutral-900 tracking-tight leading-tight">
                Select categories that best describe your business
              </h2>
              <p className="text-neutral-500 text-sm leading-relaxed">
                Choose your primary and up to 3 related service type
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categoriesList.map((cat) => {
                const isSelected = selectedCategories.find((c) => c.id === cat.id);
                const IconComponent = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`relative text-left p-4.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-4 min-h-[110px] justify-between ${
                      isSelected 
                        ? "border-violet-600 bg-white" 
                        : "border-neutral-200 hover:border-neutral-300 bg-white"
                    }`}
                  >
                    <IconComponent className={`w-6 h-6 stroke-[1.6] ${isSelected ? "text-violet-600" : "text-neutral-800"}`} />
                    <span className="font-bold tracking-tight text-neutral-900 text-[13px] md:text-[14px] leading-tight pr-6">
                      {cat.id}
                    </span>
                    {isSelected && (
                      <span className="absolute top-3 right-3 text-[10px] font-extrabold tracking-tight shrink-0 bg-violet-600 text-white rounded-lg px-2 py-0.5 min-w-[20px] text-center leading-normal">
                        {isSelected.rank === 1 ? "Primary" : isSelected.rank}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {step === "account_type" && (
        <div className="min-h-screen flex flex-col bg-white">
          <OnboardingHeader
            currentStep={3}
            onBack={() => setStep("categories")}
            onRightAction={() => setStep("location_type")}
            rightActionIcon={<ArrowRight size={14} />}
          />

          <div className="flex-1 max-w-[540px] w-full mx-auto px-6 py-16 flex flex-col justify-center space-y-8">
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Account setup</span>
              <h2 className="text-[32px] md:text-[38px] font-bold text-neutral-900 tracking-tight leading-tight">
                Select account type
              </h2>
              <p className="text-neutral-500 text-sm leading-relaxed">
                This will help us set up your account correctly
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setAccountType("independent")}
                className={`p-6 border-2 rounded-2xl text-left bg-white transition-all cursor-pointer flex flex-col gap-4 ${
                  accountType === "independent" 
                    ? "border-violet-600" 
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <User className={`w-8 h-8 ${accountType === "independent" ? "text-violet-600" : "text-neutral-500"}`} />
                <span className="font-bold text-neutral-900 text-[15px]">
                  I'm an independent
                </span>
              </button>

              <button
                onClick={() => setAccountType("team")}
                className={`p-6 border-2 rounded-2xl text-left bg-white transition-all cursor-pointer flex flex-col gap-4 ${
                  accountType === "team" 
                    ? "border-violet-600" 
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <Users className={`w-8 h-8 ${accountType === "team" ? "text-violet-600" : "text-neutral-500"}`} />
                <span className="font-bold text-neutral-900 text-[15px]">
                  I have a team
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "location_type" && (
        <div className="min-h-screen flex flex-col bg-white">
          <OnboardingHeader
            currentStep={4}
            onBack={() => setStep("account_type")}
            onRightAction={() => setStep("location_set")}
            rightActionIcon={<ArrowRight size={14} />}
            rightCloseAction={() => setStep("location_set")}
          />

          <div className="flex-1 max-w-[540px] w-full mx-auto px-6 py-16 flex flex-col justify-center space-y-8">
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Account setup</span>
              <h2 className="text-[32px] md:text-[38px] font-bold text-neutral-900 tracking-tight leading-tight">
                Where do you provide your services?
              </h2>
            </div>

            <div className="space-y-3.5">
              <button
                onClick={() => setServiceLocation("physical")}
                className={`w-full p-5 border-2 rounded-2xl text-left bg-white transition-all cursor-pointer font-bold text-[14px] md:text-[15px] ${
                  serviceLocation === "physical" 
                    ? "border-violet-600 bg-violet-50/5 text-violet-750" 
                    : "border-neutral-200 hover:border-neutral-300 text-neutral-800"
                }`}
              >
                Clients come to me at a physical location
              </button>

              <button
                onClick={() => setServiceLocation("mobile")}
                className={`w-full p-5 border-2 rounded-2xl text-left bg-white transition-all cursor-pointer font-bold text-[14px] md:text-[15px] ${
                  serviceLocation === "mobile" 
                    ? "border-violet-600 bg-violet-50/5 text-violet-750" 
                    : "border-neutral-200 hover:border-neutral-300 text-neutral-800"
                }`}
              >
                I visit my clients as a mobile operator
              </button>

              <button
                onClick={() => setServiceLocation("virtual")}
                className={`w-full p-5 border-2 rounded-2xl text-left bg-white transition-all cursor-pointer font-bold text-[14px] md:text-[15px] ${
                  serviceLocation === "virtual" 
                    ? "border-violet-600 bg-violet-50/5 text-violet-750" 
                    : "border-neutral-200 hover:border-neutral-300 text-neutral-800"
                }`}
              >
                I provide virtual services online
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "location_set" && (
        <div className="min-h-screen flex flex-col bg-white">
          <OnboardingHeader
            currentStep={4}
            onBack={() => setStep("location_type")}
            onRightAction={() => setStep("hear_about")}
            rightActionIcon={<ArrowRight size={14} />}
            rightCloseAction={() => setStep("hear_about")}
          />

          <div className="flex-1 max-w-[620px] w-full mx-auto px-6 py-10 flex flex-col justify-center space-y-6">
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Account setup</span>
              <h2 className="text-[28px] md:text-[34px] font-bold text-neutral-900 tracking-tight leading-tight">
                Set your venue's physical location
              </h2>
              <p className="text-neutral-500 text-sm leading-relaxed">
                Add your primary business location so your clients can easily find you. Additional locations can be added later.
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-widest">Business location</h3>
                <span className="text-xs text-neutral-500 font-bold block">Where is your business located?</span>
                
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                  {isEditingAddress ? (
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      onBlur={() => setIsEditingAddress(false)}
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-xl outline-none focus:border-neutral-950 transition-all text-sm font-semibold"
                    />
                  ) : (
                    <div 
                      onClick={() => setIsEditingAddress(true)}
                      className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-xl bg-white text-sm font-semibold text-neutral-800 cursor-pointer truncate"
                    >
                      {address}
                    </div>
                  )}
                </div>
              </div>

              <div className="border border-neutral-200 rounded-2xl overflow-hidden relative shadow-inner select-none h-60 bg-sky-50">
                <div 
                  className="absolute inset-0 cursor-grab active:cursor-grabbing"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <svg 
                    width="100%" 
                    height="100%" 
                    className="absolute"
                    style={{
                      transform: `translate(${mapOffset.x}px, ${mapOffset.y}px) scale(${mapZoom / 15})`,
                      transformOrigin: "center center"
                    }}
                  >
                    <rect width="1000" height="1000" x="-100" y="-100" fill="#E8ECE9" />
                    <path d="M-100,50 Q100,200 400,20 M100,20 L300,500 M400,50 L50,450" stroke="#CCD1CD" strokeWidth="20" fill="none" />
                    <path d="M-50,220 C200,100 350,300 600,150" stroke="#7CB342" strokeWidth="12" fill="none" opacity="0.3" />
                    <path d="M120,-20 L150,600" stroke="#CCD1CD" strokeWidth="25" fill="none" />
                    <path d="M-100,150 L800,450" stroke="#E28743" strokeWidth="10" fill="none" opacity="0.4" />
                    <ellipse cx="250" cy="120" rx="30" ry="12" fill="#81C784" opacity="0.4" />
                    <ellipse cx="140" cy="280" rx="45" ry="15" fill="#81C784" opacity="0.3" />
                  </svg>
                  <div className="absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-[85%] text-neutral-900 pointer-events-none">
                    <div className="relative flex flex-col items-center">
                      <div className="bg-neutral-900 text-white rounded-lg p-2.5 shadow-lg flex items-center gap-1 text-[11px] font-bold tracking-tight whitespace-nowrap mb-1">
                        <svg className="w-4 h-4 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                        Venue Location
                      </div>
                      <div className="w-7 h-7 bg-rose-500 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute right-4 top-4 flex flex-col gap-1 shadow-md">
                  <button 
                    onClick={() => setMapZoom(Math.min(mapZoom + 1, 20))}
                    className="w-10 h-10 bg-white border border-neutral-200 flex items-center justify-center font-bold text-neutral-700 hover:bg-neutral-50 rounded-t-lg text-lg cursor-pointer"
                  >
                    +
                  </button>
                  <button 
                    onClick={() => setMapZoom(Math.max(mapZoom - 1, 10))}
                    className="w-10 h-10 bg-white border-x border-b border-neutral-200 flex items-center justify-center font-bold text-neutral-700 hover:bg-neutral-50 rounded-b-lg text-lg cursor-pointer"
                  >
                    -
                  </button>
                </div>
              </div>

              <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-start gap-2.5">
                  <MapPin className="text-neutral-500 shrink-0 mt-0.5" size={16} />
                  <div className="text-[13px] leading-tight text-neutral-700 font-bold">
                    {address}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingAddress(true)}
                  className="px-3 py-1.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                >
                  Edit
                </button>
              </div>

              <p className="text-[11px] text-neutral-400 font-bold block text-center">
                Drag the map to adjust the pin position
              </p>
            </div>
          </div>
        </div>
      )}

      {step === "hear_about" && (
        <div className="min-h-screen flex flex-col bg-white">
          <OnboardingHeader
            currentStep={5}
            onBack={() => setStep("location_set")}
            onRightAction={handleDone}
            rightActionDisabled={!marketingSource}
            rightActionText="Done"
            rightCloseAction={handleDone}
            isLoading={isLoading}
          />

          <div className="flex-1 max-w-[540px] w-full mx-auto px-6 py-10 flex flex-col justify-center space-y-6">
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Account setup</span>
              <h2 className="text-[28px] md:text-[34px] font-bold text-neutral-900 tracking-tight leading-tight">
                How did you hear about <span className="bg-sky-100 text-neutral-900 px-2.5 py-0.5 rounded-lg border border-sky-200">Ayatas</span>?
              </h2>
            </div>

            <div className="space-y-2.5">
              {[
                "Recommended by a friend",
                "Search engine (e.g. Google, Bing)",
                "Social media",
                "Advert in the mail",
                "Magazine ad",
                "Ratings website (e.g. Capterra, Trustpilot)",
                "AI Chatbot (e.g. ChatGPT, Gemini, DeepSeek)",
                "Other"
              ].map((src) => {
                const isSelected = marketingSource === src;
                return (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setMarketingSource(src)}
                    className={`w-full p-4 border rounded-xl bg-white text-left transition-all flex items-center gap-3.5 hover:bg-neutral-50 text-sm font-semibold cursor-pointer ${
                      isSelected ? "border-violet-600 ring-2 ring-violet-100" : "border-neutral-200"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? "border-violet-600 bg-violet-600 text-white" : "border-neutral-300 bg-white"
                    }`}>
                      {isSelected && <Check size={10} strokeWidth={3} />}
                    </div>
                    <span className="text-neutral-850">{src}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
