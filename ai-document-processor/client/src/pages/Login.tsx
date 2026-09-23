import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* LEFT BRAND SECTION */}
      <div className="login-showcase">
        <div className="showcase-content">

          <div className="brand">
            <div className="brand-icon">✦</div>
            <span>DocuLens</span>
          </div>

          <div className="showcase-main">
            <span className="eyebrow">
              AI-POWERED DOCUMENT INTELLIGENCE
            </span>

            <h1>
              Turn complex
              <br />
              documents into
              <br />
              <span>clear insights.</span>
            </h1>

            <p>
              Upload your documents and let AI extract summaries,
              key information and important details in seconds.
            </p>

            <div className="feature-list">
              <div className="feature">
                <div className="feature-icon">✦</div>
                <div>
                  <strong>AI-powered analysis</strong>
                  <span>Understand documents faster</span>
                </div>
              </div>

              <div className="feature">
                <div className="feature-icon">✓</div>
                <div>
                  <strong>Instant summaries</strong>
                  <span>Get the important information quickly</span>
                </div>
              </div>

              <div className="feature">
                <div className="feature-icon">⌁</div>
                <div>
                  <strong>Simple & secure</strong>
                  <span>Your workflow, without the complexity</span>
                </div>
              </div>
            </div>
          </div>

          <div className="showcase-footer">
            © 2026 DocuLens · Intelligent document processing
          </div>

        </div>
      </div>

      {/* RIGHT LOGIN SECTION */}
      <div className="login-section">

        <div className="login-card">

          <div className="mobile-brand">
            <div className="brand-icon">✦</div>
            <span>DocuLens</span>
          </div>

          <div className="login-heading">
            <span className="welcome">WELCOME BACK</span>
            <h2>Sign in to your account</h2>
            <p>
              Continue where you left off and access your documents.
            </p>
          </div>

          <form onSubmit={onSubmit}>

            <div className="field">
              <label htmlFor="email">Email address</label>

              <div className="input-wrapper">
                <span className="input-icon">✉</span>

                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <div className="label-row">
                <label htmlFor="password">Password</label>
              </div>

              <div className="input-wrapper">
                <span className="input-icon">⌑</span>

                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="login-error">
                <span>!</span>
                {error}
              </div>
            )}

            <button
              className="login-button"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Signing you in...
                </>
              ) : (
                <>
                  Sign in
                  <span className="arrow">→</span>
                </>
              )}
            </button>

          </form>

          <div className="divider">
            <span>New to DocuLens?</span>
          </div>

          <Link to="/register" className="create-account">
            Create an account
            <span>→</span>
          </Link>

          <p className="security-note">
            <span>⌾</span>
            Your information is protected and securely processed.
          </p>

        </div>

      </div>

    </div>
  );
}