import { Outlet, Link } from "react-router-dom";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import version from '../version';

const Layout = ({ user, setUser }) => {
  const handleLogout = async () => {
    await fetch('/api/auth/logout');
    setUser(null);
    window.location.reload();
  };
  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
        <Container>
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 128 128" 
              className="me-2" 
              aria-hidden="true"
            >
              <rect width="128" height="128" rx="24" fill="#24313E"/>
              <circle cx="64" cy="64" r="40" stroke="white" strokeWidth="12" fill="none"/>
            </svg>
            
            <div className="d-flex align-items-center">
              <span style={{ fontWeight: 'bold', color: '#f8f9fa', letterSpacing: '0.5px', fontSize: '1.4rem' }}>NUMIS</span>
              <span style={{ fontWeight: '300', color: '#adb5bd', marginLeft: '2px', fontSize: '1.4rem' }}>TAG</span>
            </div>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="numis-nav" />
          
          <Navbar.Collapse id="numis-nav">
            <Nav className="ms-auto align-items-center">
              <Nav.Link as={Link} to="/" className="me-3 text-uppercase small fw-bold">
                Home
              </Nav.Link>
              <Nav.Link as={Link} to="/print">
                <Button 
                  variant="outline-info" 
                  size="sm" 
                  className="fw-bold px-3 border-2"
                  style={{ borderRadius: '20px' }}
                >
                  PRINT 2x2 LABELS
                </Button>
              </Nav.Link>
              {user && (
                <div className="d-flex align-items-center ms-3">
                  <span className="text-info small fw-bold me-2">{user.username}</span>
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    className="fw-bold px-3 border-2"
                    style={{ borderRadius: '20px' }}
                    onClick={handleLogout}
                  >
                    LOGOUT
                  </Button>
                </div>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="py-5" style={{ minHeight: '80vh' }}>
        <Container>
          <Outlet />
        </Container>
      </main>

      <footer className="text-center py-4 mt-auto border-top bg-light">
        <p className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>
          &copy; {new Date().getFullYear()} NumisTag | Premium Coin Labeling powered by <a href="https://en.numista.com" target="_blank" rel="noopener noreferrer">Numista</a>
          <span className="ms-2 text-muted" style={{ fontSize: '0.75rem' }}>v{version}</span>
        </p>
      </footer>
    </>
  );
};

export default Layout;