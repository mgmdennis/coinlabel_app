import { Outlet, Link } from "react-router-dom";
import { Navbar, Nav, Container, Button } from "react-bootstrap";

const Layout = () => {
  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
        <Container>
          {/* Professional branding for NumisTag */}
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
            <span style={{ 
              fontWeight: 'bold', 
              color: '#f8f9fa', 
              letterSpacing: '0.5px' 
            }}>NUMIS</span>
            <span style={{ 
              fontWeight: '300', 
              color: '#adb5bd', 
              marginLeft: '2px' 
            }}>TAG</span>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="numis-nav" />
          
          <Navbar.Collapse id="numis-nav">
            <Nav className="ms-auto align-items-center">
              <Nav.Link as={Link} to="/" className="me-3">Home</Nav.Link>
              
              <Nav.Link 
                as={Link} 
                to="/print" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="info" size="sm" className="text-dark fw-bold">
                  Print 2x2 Labels
                </Button>
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="py-5">
        <Container>
          <Outlet />
        </Container>
      </main>

      <footer className="text-center py-4 mt-auto border-top bg-light">
        <p className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>
          &copy; {new Date().getFullYear()} NumisTag | Premium Coin Labeling
        </p>
      </footer>
    </>
  );
};

export default Layout;