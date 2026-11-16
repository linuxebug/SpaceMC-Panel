// @ts-nocheck
import React, { useState } from "react";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const { login } = useAuth();
  const { panelName, panelLogo, enableRegistration } = useSettings();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await axios.post("/api/auth/login", { username, password });
      login(res.data.token, res.data.user);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await axios.post("/api/auth/forgot-password", { email: forgotEmail });
      setForgotSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send reset email");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground selection:bg-green-500/30">
      <div className="hidden lg:flex w-1/2 bg-card relative overflow-hidden items-center justify-center border-r border-border">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-full max-h-[800px] bg-green-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute right-0 top-0 w-64 h-64 bg-green-800/5 blur-[100px] rounded-full" />
        <div className="absolute left-0 bottom-0 w-64 h-64 bg-green-500/5 blur-[100px] rounded-full" />
        
        <div className="relative z-10 max-w-lg p-12 text-right">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-8 ml-auto">
            {panelLogo ? (
              <img src={panelLogo} alt="Logo" className="w-8 h-8 rounded-xl object-contain" />
            ) : (
              <svg className="w-8 h-8 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            )}
          </div>
          <h2 className="text-4xl font-bold mb-6 leading-tight">Host your Minecraft server.</h2>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Premium hosting with forest-green elegance. Deploy, manage, and scale your servers with SpaceMC Panel.
          </p>
          
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="p-4 rounded-xl bg-background/50 border border-border-subtle backdrop-blur-sm">
              <div className="font-bold text-lg text-white mb-1">Instant Setup</div>
              <div className="text-xs text-muted-foreground">Servers deploy in seconds</div>
            </div>
            <div className="p-4 rounded-xl bg-background/50 border border-border-subtle backdrop-blur-sm">
              <div className="font-bold text-lg text-white mb-1">Full Control</div>
              <div className="text-xs text-muted-foreground">Console, files & advanced config</div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative z-10">
        <div className="w-full max-w-sm mx-auto">
          {!showForgot ? (
            <div className="flex items-center gap-3 mb-10">
              {panelLogo ? (
                <img src={panelLogo} alt="Logo" className="w-10 h-10 rounded-xl object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-green-700 flex items-center justify-center text-white shadow-lg">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
              )}
              <h1 className="text-2xl font-bold tracking-tight">{panelName}</h1>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight mb-2">Welcome back</h2>
              <p className="text-muted-foreground">Sign in to manage your servers.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Username</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <input 
                    type="text" 
                    name="username"
                    required
                    placeholder="Username"
                    className="w-full bg-card border border-border focus:border-green-500 focus:ring-1 focus:ring-green-500/50 rounded-xl py-3 pl-10 pr-4 outline-none transition-all text-white"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-white">Password</label>
                  <button 
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-[10px] text-green-400 hover:text-green-300 font-medium transition-colors underline underline-offset-4"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <input 
                    type="password" 
                    name="password"
                    required
                    placeholder="••••••••"
                    className="w-full bg-card border border-border focus:border-green-500 focus:ring-1 focus:ring-green-500/50 rounded-xl py-3 pl-10 pr-4 outline-none transition-all text-white"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 btn-forest py-3 px-4 rounded-xl font-medium transition-all shadow-lg shadow-[0_0_15px_rgba(34,197,94,0.3)]reen-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {enableRegistration !== false && (
              <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link to="/register" className="text-green-400 hover:text-green-300 font-medium transition-colors underline underline-offset-4">
                    Register
                  </Link>
                </p>
              </div>
            )}
          </div>

          {showForgot && (
            <div className="animate-qx-fade-up">
              <div className="flex items-center gap-3 mb-6">
                <button 
                  onClick={() => setShowForgot(false)}
                  className="p-2 text-muted-foreground hover:text-white hover:bg-card/60 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
                <h2 className="text-xl font-bold">Forgot Password</h2>
              </div>
              <p className="text-muted-foreground mb-6">Enter your email and we'll send you a reset link.</p>

              {forgotSuccess ? (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium text-center mb-6">
                  Reset link sent! Check your email.
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Email Address</label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      <input 
                        type="email" 
                        required
                        placeholder="you@example.com"
                        className="w-full bg-card border border-border focus:border-green-500 focus:ring-1 focus:ring-green-500/50 rounded-xl py-3 pl-10 pr-4 outline-none transition-all text-white"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={forgotLoading}
                    className="w-full btn-forest py-3 px-4 rounded-xl font-medium transition-all disabled:opacity-50"
                  >
                    {forgotLoading ? "Sending..." : "Send Reset Link"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {isLoading && <LoadingOverlay message="Authenticating..." />}
      {forgotLoading && <LoadingOverlay message="Sending..." />}
    </div>
  );
}

