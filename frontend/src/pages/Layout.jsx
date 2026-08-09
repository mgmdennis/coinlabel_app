import { Outlet, Link } from "react-router-dom";
import {
  Anchor,
  Box,
  Burger,
  Button,
  Container,
  Drawer,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import version from '../version';
import { BASE_URL } from '../config';

const BrandMark = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 128 128" aria-hidden="true">
    <rect width="128" height="128" rx="24" fill="#24313E" />
    <circle cx="64" cy="64" r="40" stroke="white" strokeWidth="12" fill="none" />
  </svg>
);

const BrandName = ({ light }) => (
  <Group gap={2} align="center">
    <Text
      span
      fw={700}
      style={{ letterSpacing: '0.5px', fontSize: '1.4rem', color: light ? '#f8f9fa' : '#212529' }}
    >
      NUMIS
    </Text>
    <Text
      span
      fw={300}
      style={{ fontSize: '1.4rem', color: light ? '#adb5bd' : '#6c757d' }}
    >
      TAG
    </Text>
  </Group>
);

const Layout = ({ user, setUser }) => {
  const [opened, { toggle, close }] = useDisclosure(false);

  // Opening the mobile drawer should dismiss any contextual UI (e.g. Home's
  // bulk-selection action bar) so it doesn't linger over the drawer.
  const handleBurgerClick = () => {
    if (!opened) {
      window.dispatchEvent(new Event('numistag:dismiss-selection'));
    }
    toggle();
  };

  const handleLogout = async () => {
    await fetch(`${BASE_URL}/auth/logout`, { credentials: 'include' });
    setUser(null);
    window.location.reload();
  };

  const navLinks = (
    <>
      <Anchor
        component={Link}
        to="/"
        onClick={close}
        c="gray.4"
        fw={700}
        tt="uppercase"
        size="sm"
        underline="never"
      >
        Home
      </Anchor>
      <Button
        component={Link}
        to="/print"
        onClick={close}
        variant="outline"
        color="cyan"
        size="xs"
        radius="xl"
        fw={700}
      >
        PRINT 2×2 LABELS
      </Button>
      <Anchor
        component={Link}
        to="/settings"
        onClick={close}
        c="gray.4"
        fw={700}
        tt="uppercase"
        size="sm"
        underline="never"
      >
        Settings
      </Anchor>
    </>
  );

  return (
    <Box mih="100vh" style={{ display: 'flex', flexDirection: 'column' }}>
      <Box component="header" bg="slate.8" py="sm" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }}>
        <Container size="lg">
          <Group justify="space-between" wrap="nowrap">
            <Anchor component={Link} to="/" underline="never">
              <Group gap="xs" align="center" wrap="nowrap">
                <BrandMark />
                <BrandName light />
              </Group>
            </Anchor>

            {/* Desktop nav */}
            <Group gap="lg" visibleFrom="sm" align="center">
              {navLinks}
              {user && (
                <Group gap="sm" align="center">
                  <Text c="cyan.4" size="sm" fw={700}>{user.username}</Text>
                  <Button
                    variant="outline"
                    color="gray"
                    size="xs"
                    radius="xl"
                    fw={700}
                    onClick={handleLogout}
                  >
                    LOGOUT
                  </Button>
                </Group>
              )}
            </Group>

            {/* Mobile burger */}
            <Burger
              opened={opened}
              onClick={handleBurgerClick}
              hiddenFrom="sm"
              color="white"
              aria-label="Toggle navigation"
            />
          </Group>
        </Container>
      </Box>

      <Drawer
        opened={opened}
        onClose={close}
        position="right"
        size="70%"
        title={<BrandName />}
        hiddenFrom="sm"
      >
        <Stack gap="md">
          {navLinks}
          {user && (
            <Stack gap="xs" mt="md">
              <Text c="dimmed" size="sm" fw={700}>{user.username}</Text>
              <Button variant="outline" color="gray" radius="xl" fw={700} onClick={handleLogout}>
                LOGOUT
              </Button>
            </Stack>
          )}
        </Stack>
      </Drawer>

      <Box component="main" py="xl" style={{ flex: 1, minHeight: '80vh' }}>
        <Container size="lg">
          <Outlet />
        </Container>
      </Box>

      <Box component="footer" ta="center" py="lg" bg="slate.0" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
        <Text size="sm" c="dimmed">
          © {new Date().getFullYear()} NumisTag | Premium Coin Labeling powered by{' '}
          <Anchor href="https://en.numista.com" target="_blank" rel="noopener noreferrer">Numista</Anchor>
          <Text span size="xs" c="dimmed" ml="xs">v{version}</Text>
        </Text>
      </Box>
    </Box>
  );
};

export default Layout;
