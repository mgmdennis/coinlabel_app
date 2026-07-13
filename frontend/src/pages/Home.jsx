import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  Checkbox,
  Container,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import {
  Search, PenLine, Pencil, Copy, ChevronDown, ChevronUp, ChevronsUpDown,
  Archive, ArchiveRestore, Printer, Trash2, X,
} from 'lucide-react';

import { BASE_URL } from '../config';
import { FrontLabelContainer, BackLabelContainer } from "./label";

const Home = () => {
  const [coins, setCoins] = useState(null);
  const [numistaNumber, setNumistaNumber] = useState("");
  const [view, setView] = useState('collection'); // 'collection' | 'cache'
  const navigate = useNavigate();

  // --- Persistence Logic ---
  const [selectedCoins, setSelectedCoins] = useState(() => {
    const saved = localStorage.getItem("selected_coins");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem("selected_coins", JSON.stringify(selectedCoins));
  }, [selectedCoins]);

  // Dismiss the bulk-selection action bar when the mobile nav drawer opens
  useEffect(() => {
    const clearSelection = () => setSelectedCoins({});
    window.addEventListener('numistag:dismiss-selection', clearSelection);
    return () => window.removeEventListener('numistag:dismiss-selection', clearSelection);
  }, []);

  useEffect(() => {
    getCoins();
  }, []);

  const getCoins = () => {
    axios
      .get(`${BASE_URL}/coins`)
      .then((res) => setCoins(res.data))
      .catch((err) => console.error(err));
  };

  const executeDelete = (id) => {
    return axios
      .delete(`${BASE_URL}/coin/delete/${id}`)
      .then((res) => {
        setCoins(prev => prev.filter((coin) => coin._id !== res.data._id));
        setSelectedCoins(prev => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
      })
      .catch((err) => console.error(err));
  };

  const handleDeleteSelected = async () => {
    const selectedIds = Object.keys(selectedCoins).filter(id => selectedCoins[id]);
    const count = selectedIds.length;
    if (window.confirm(`Are you sure you want to delete ${count} selected coins?`)) {
      try {
        await Promise.all(selectedIds.map(id => axios.delete(`${BASE_URL}/coin/delete/${id}`)));
        setCoins(prev => prev.filter(coin => !selectedIds.includes(coin._id)));
        setSelectedCoins({});
      } catch (err) {
        console.error("Error deleting coins:", err);
      }
    }
  };

  const handleBulkCache = async (cached) => {
    const selectedIds = Object.keys(selectedCoins).filter(id => selectedCoins[id]);
    try {
      await axios.patch(`${BASE_URL}/coins/cache`, { ids: selectedIds, cached });
      setCoins(prev => prev.map(coin =>
        selectedIds.includes(coin._id) ? { ...coin, cached } : coin
      ));
      setSelectedCoins({});
    } catch (err) {
      console.error('Error updating cache status:', err);
    }
  };

  const handleSelectAll = () => {
    if (!visibleCoins) return;
    const allSelected = {};
    visibleCoins.forEach(coin => {
      allSelected[coin._id] = true;
    });
    setSelectedCoins(allSelected);
  };

  const toggleSelect = (id) => {
    setSelectedCoins(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const activeCoins = coins ? coins.filter(c => !c.cached) : null;
  const cachedCoins = coins ? coins.filter(c => c.cached) : null;
  const visibleCoins = view === 'collection' ? activeCoins : cachedCoins;

  const selectedIds = Object.keys(selectedCoins).filter(id => selectedCoins[id]);

  // --- Collapse state ---
  const [collapsedCards, setCollapsedCards] = useState({});

  const toggleCollapse = (id) => {
    setCollapsedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const allCollapsed = visibleCoins && visibleCoins.length > 0 && visibleCoins.every(c => collapsedCards[c._id]);

  const toggleCollapseAll = () => {
    if (!visibleCoins) return;
    if (allCollapsed) {
      setCollapsedCards({});
    } else {
      const all = {};
      visibleCoins.forEach(c => { all[c._id] = true; });
      setCollapsedCards(all);
    }
  };

  const handlePrintSelected = () => {
    navigate('/print', { state: { selectedIds } });
  };

  const handleDuplicateCoin = (coin) => {
    navigate('/create/' + coin.numistaNumber, { state: { ...coin, _id: undefined } });
  };

  const handleFormSubmit = (e) => {
    if (e) e.preventDefault();
    if (numistaNumber) {
      navigate('/create/' + numistaNumber);
    }
  };

  // --- Select-all header state ---
  const hasVisible = visibleCoins && visibleCoins.length > 0;
  const allSelected = hasVisible && selectedIds.length === visibleCoins.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const selectAllLabel = allSelected
    ? 'All selected'
    : someSelected
      ? `${selectedIds.length} selected`
      : 'Select all';

  const handleSelectAllToggle = () => {
    if (allSelected) {
      setSelectedCoins({});
    } else {
      handleSelectAll();
    }
  };

  return (
    <Container size="lg" pb="xl">

      {/* View toggle */}
      <Group mb="md" gap="xs">
        <Button
          variant={view === 'collection' ? 'filled' : 'default'}
          size="xs"
          onClick={() => { setView('collection'); setSelectedCoins({}); }}
        >
          My Collection {activeCoins ? `(${activeCoins.length})` : ''}
        </Button>
        <Button
          variant={view === 'cache' ? 'filled' : 'default'}
          color={view === 'cache' ? 'yellow' : undefined}
          size="xs"
          leftSection={<Archive size={13} />}
          onClick={() => { setView('cache'); setSelectedCoins({}); }}
        >
          Cached {cachedCoins && cachedCoins.length > 0 ? `(${cachedCoins.length})` : ''}
        </Button>
      </Group>

      <Paper withBorder radius="md" p="md" mb="lg" shadow="xs">
        <Group align="center" gap="md" wrap="wrap">
          {/* Numista lookup */}
          <form onSubmit={handleFormSubmit} style={{ flex: '1 1 auto', minWidth: 0 }}>
            <Group gap={0} wrap="nowrap" align="stretch">
              <TextInput
                leftSection={<Text size="sm" c="dimmed">N#</Text>}
                value={numistaNumber}
                onChange={(e) => setNumistaNumber(e.target.value.trim().replace(/\D+/g, ''))}
                placeholder="Numista number..."
                style={{ flex: 1, minWidth: 0 }}
                styles={{ input: { borderTopRightRadius: 0, borderBottomRightRadius: 0 } }}
              />
              <Button type="submit" px="md" style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
                <Search size={14} />
              </Button>
            </Group>
          </form>

          <Box visibleFrom="md" style={{ width: 1, height: 36, background: 'var(--mantine-color-gray-3)', flexShrink: 0 }} />

          <Button
            variant="default"
            size="xs"
            leftSection={<PenLine size={13} />}
            onClick={() => navigate("/create", { state: { manualMode: true } })}
          >
            Manual Entry
          </Button>
        </Group>
      </Paper>

      {/* Action Bar */}
      {selectedIds.length > 0 && (
        <Box mb="lg" style={{ position: 'sticky', top: 10, zIndex: 1020 }}>
          <Paper shadow="md" radius="md" p="xs" withBorder maw={640} mx="auto">
            <Group justify="center" gap="xs" wrap="wrap">
              <Button size="xs" onClick={handlePrintSelected} leftSection={<Printer size={13} />}>
                Print Selected ({selectedIds.length})
              </Button>
              {view === 'collection' ? (
                <Button size="xs" variant="default" onClick={() => handleBulkCache(true)} leftSection={<Archive size={13} />}>
                  Cache Selected
                </Button>
              ) : (
                <Button size="xs" variant="default" onClick={() => handleBulkCache(false)} leftSection={<ArchiveRestore size={13} />}>
                  Restore Selected
                </Button>
              )}
              <Button size="xs" variant="light" color="red" onClick={handleDeleteSelected} leftSection={<Trash2 size={13} />}>
                Delete Selected
              </Button>
              <Button size="xs" variant="subtle" color="gray" onClick={() => setSelectedCoins({})} leftSection={<X size={13} />}>
                Cancel
              </Button>
            </Group>
          </Paper>
        </Box>
      )}

      <div className="coins-list">
        {hasVisible && (
          <Group justify="space-between" mb="xs" pl="md">
            <Checkbox
              id="select-all-checkbox"
              checked={allSelected}
              indeterminate={someSelected}
              onChange={handleSelectAllToggle}
              label={<Text size="sm" c="dimmed">{selectAllLabel}</Text>}
            />
            <Button
              variant="subtle"
              color="gray"
              size="compact-sm"
              onClick={toggleCollapseAll}
              leftSection={<ChevronsUpDown size={14} />}
            >
              <Text size="sm">{allCollapsed ? 'Expand all' : 'Collapse all'}</Text>
            </Button>
          </Group>
        )}

        {coins === null ? (
          // Loading skeletons
          <Stack my="xl" gap="lg">
            {[1, 2, 3].map(i => (
              <Card key={i} withBorder shadow="sm" padding="md">
                <Stack gap="sm">
                  <Skeleton height={16} width="60%" radius="sm" />
                  <Skeleton height={12} width="40%" radius="sm" />
                  <Skeleton height={12} width="70%" radius="sm" />
                  <Skeleton height={12} width="50%" radius="sm" />
                </Stack>
              </Card>
            ))}
          </Stack>
        ) : !hasVisible ? (
          <Stack align="center" my="xl" gap={4}>
            <Box style={{ color: 'var(--mantine-color-gray-5)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                <path d="M8 13A5 5 0 1 1 8 3a5 5 0 0 1 0 10zm0 1A6 6 0 1 0 8 2a6 6 0 0 0 0 12z" />
                <path d="M8 11a3 3 0 1 1 0-6a3 3 0 0 1 0 6z" />
              </svg>
            </Box>
            {view === 'cache' ? (
              <Text size="lg" c="dimmed" mt="sm">There are no items cached.</Text>
            ) : (
              <>
                <Text size="lg" c="dimmed" mt="sm">No coins in your collection yet</Text>
                <Text c="dimmed">Start by adding your first coin to see it here.</Text>
              </>
            )}
          </Stack>
        ) : (
          <Stack gap="lg">
            {visibleCoins.map((coin) => {
              const isSelected = !!selectedCoins[coin._id];
              const isCollapsed = collapsedCards[coin._id];
              return (
                <Card
                  key={coin._id}
                  withBorder
                  shadow="sm"
                  padding={0}
                  style={isSelected ? { borderColor: 'var(--mantine-color-blue-6)' } : undefined}
                >
                  <Box
                    px="md"
                    py="sm"
                    onClick={() => toggleCollapse(coin._id)}
                    style={{
                      cursor: 'pointer',
                      background: isSelected ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-0)',
                      color: isSelected ? 'white' : undefined,
                      borderBottom: '1px solid var(--mantine-color-gray-2)',
                    }}
                  >
                    <Group align="center" wrap="nowrap" gap="sm">
                      <Box onClick={e => e.stopPropagation()} style={{ display: 'flex' }}>
                        <Checkbox
                          id={`check-${coin._id}`}
                          checked={isSelected}
                          onChange={() => toggleSelect(coin._id)}
                        />
                      </Box>
                      <Text fw={700} tt="uppercase" style={{ letterSpacing: '0.5px', flex: 1 }}>
                        {coin.issuer} — {coin.denomination}, {coin.year}
                      </Text>
                      {isCollapsed
                        ? <ChevronDown size={16} style={{ opacity: isSelected ? 1 : 0.6 }} />
                        : <ChevronUp size={16} style={{ opacity: isSelected ? 1 : 0.6 }} />
                      }
                    </Group>
                  </Box>

                  {!isCollapsed && (
                    <Box p="md">
                      <Group align="center" gap="lg" justify="center" wrap="wrap">
                        <Group gap="md" justify="center" style={{ flex: 1 }} wrap="wrap">
                          <div className="label-wrapper label-card">
                            <FrontLabelContainer isEditable={false} {...coin} />
                          </div>
                          <div className="label-wrapper label-card">
                            <BackLabelContainer isEditable={false} {...coin} />
                          </div>
                        </Group>

                        <Button.Group>
                          <Button
                            component={Link}
                            to={`/create/${coin.numistaNumber}`}
                            state={{ coinId: coin._id }}
                            variant="default"
                            size="xs"
                            leftSection={<Pencil size={13} />}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="default"
                            size="xs"
                            onClick={() => handleDuplicateCoin(coin)}
                            leftSection={<Copy size={13} />}
                          >
                            Duplicate
                          </Button>
                        </Button.Group>
                      </Group>
                    </Box>
                  )}
                </Card>
              );
            })}
          </Stack>
        )}
      </div>
    </Container>
  );
};

export default Home;
