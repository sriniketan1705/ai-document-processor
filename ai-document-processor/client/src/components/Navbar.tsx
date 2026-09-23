import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand">
          DocuLens
        </NavLink>
        <nav className="nav-links">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/documents">Documents</NavLink>
        </nav>
        <div className="nav-user">
          <span className="nav-name">{user?.name}</span>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
