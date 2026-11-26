
import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Auth({ onAuthSuccess, initialMode = "register" }) {
  const [isLogin, setIsLogin] = useState(initialMode === "login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setMessage("Please select a JPG, PNG, or WEBP image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage("Your profile picture must be smaller than 2 MB.");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setMessage("");
  };

  const uploadAvatar = async (user) => {
    if (!avatarFile) return;

    const extension = avatarFile.name.split(".").pop().toLowerCase();
    const filePath = `${user.id}/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile, {
        contentType: avatarFile.type,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_url: data.publicUrl })
      .eq("id", user.id);

    if (profileError) throw profileError;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        onAuthSuccess(data.session);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) throw error;

        if (data.session && avatarFile) {
          await uploadAvatar(data.user);
        }
// Always end the registration session
await supabase.auth.signOut({ scope: "local" });

// Clear the password and switch to login
setPassword("");
setAvatarFile(null);
setAvatarPreview("");
setIsLogin(true);

setMessage(
  "Registration successful! Please log in with your email and password."
);
        setPassword("");

        setMessage(
          data.session
            ? "Registration successful! Please log in with your email and password."
            : "Account created! Please confirm your email, then log in."
        );
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>TaskFlow 📋</h1>

        <h2>{isLogin ? "Welcome Back!" : "Create Your Account"}</h2>

        <p>
          {isLogin
            ? "Log in to continue to your dashboard."
            : "Register to get started with TaskFlow."}
        </p>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="auth-field">
                <label>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="auth-field">
                <label>Profile Picture (Optional)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                />

                {avatarPreview && (
                  <div className="avatar-preview">
                    <img src={avatarPreview} alt="Profile preview" />
                    <span>Picture selected</span>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="auth-field">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              minLength={6}
              required
            />
          </div>

          {message && (
            <p className="auth-message">{message}</p>
          )}

          <button type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : isLogin
                ? "Log In"
                : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin
            ? "Don't have an account?"
            : "Already have an account?"}

          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage("");
            }}
          >
            {isLogin ? "Register" : "Log In"}
          </button>
        </p>
      </div>
    </div>
  );
}
