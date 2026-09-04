import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import {
  Search, PenLine, Pencil, Copy, ChevronDown, ChevronUp, ChevronsUpDown,
  Archive, ArchiveRestore, Printer, Trash2, X, ScrollText,
} from 'lucide-react';

import { BASE_URL } from '../config';
import { FrontLabelContainer, BackLabelContainer } from "./label";

// Collection photos are served as separately-cacheable binaries; `updatedAt`
// busts the cache when a photo is re-uploaded.
const coinImageUrl = (coin, side) =>
  `${BASE_URL}/coin/${coin._id}/image/${side}?v=${encodeURIComponent(coin.updatedAt || '')}`;

const Home = () => {
  const [coins, setCoins] = useState(null);
  const [collectionItems, setCollectionItems] = useState(null);
  const [lookupMode, setLookupMode] = useState('numista'); // 'numista' | 'ocre'
  const [lookupValue, setLookupValue] = useState("");
  const location = useLocation();
  const [view, setView] = useState(location?.state?.view || 'labels');

  // A nav link can carry { state: { view } } to jump straight to a tab —
  // handle it even if Home is already mounted (same route, so the lazy
  // useState initializer above won't re-run on its own).
  useEffect(() => {
    if (location?.state?.view) {
      setView(location.state.view);
    }
  }, [location.state]);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

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

  const getCollectionItems = () => {
    if (collectionItems) return;
    axios
      .get(`${BASE_URL}/coins/collection`)
      .then((res) => setCollectionItems(res.data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    if (view === 'collection') getCollectionItems();
  }, [view]);

  const executeDelete = (id) => {
    const coin = coins?.find(c => c._id === id);
    const isCollection = coin?.isCollectionItem;
    const req = isCollection
      ? axios.put(`${BASE_URL}/coin/detach-label/${id}`)
      : axios.delete(`${BASE_URL}/coin/delete/${id}`);
    return req
      .then((res) => {
        if (isCollection) {
          // Keep the record but update it (label detached)
          setCoins(prev => prev.map(c => c._id === id ? res.data : c));
        } else {
          setCoins(prev => prev.filter((coin) => coin._id !== res.data._id));
        }
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
    const hasCollectionItems = selectedIds.some(id => coins?.find(c => c._id === id)?.isCollectionItem);
    const msg = hasCollectionItems
      ? `Delete ${count} selected label(s)? Labels on collection items will be detached but the collection items kept.`
      : `Are you sure you want to delete ${count} selected label(s)?`;
    if (window.confirm(msg)) {
      try {
        const results = await Promise.all(selectedIds.map(id => {
          const coin = coins?.find(c => c._id === id);
          return coin?.isCollectionItem
            ? axios.put(`${BASE_URL}/coin/detach-label/${id}`).then(r => ({ type: 'detach', data: r.data }))
            : axios.delete(`${BASE_URL}/coin/delete/${id}`).then(r => ({ type: 'delete', data: r.data }));
        }));
        setCoins(prev => {
          let updated = [...prev];
          results.forEach(r => {
            if (r.type === 'detach') {
              updated = updated.map(c => c._id === r.data._id ? r.data : c);
            } else {
              updated = updated.filter(c => c._id !== r.data._id);
            }
          });
          return updated;
        });
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

const activeCoins = coins ? coins.filter(c => !c.cached && c.hasLabel !== false) : null;
    const cachedCoins = coins ? coins.filter(c => c.cached && c.hasLabel !== false) : null;
    // For the collection view, use collectionItems (lazy-loaded).
    // But use the lightweight `coins` to check if any collection items exist,
    // so we can show a loading skeleton while images are still fetching.
    const collectionCount = coins ? coins.filter(c => c.isCollectionItem).length : 0;
    const collectionLoading = view === 'collection' && collectionCount > 0 && !collectionItems;
    const itemCoins = collectionItems ? collectionItems.filter(c => c.isCollectionItem) : (collectionLoading ? [] : null);
    const viewCoins = view === 'labels' ? activeCoins : view === 'cached' ? cachedCoins : itemCoins;

    const searchFields = ['issuer', 'denomination', 'year', 'grade', 'gradeDetails', 'details', 'composition', 'physicalDetails', 'reference', 'mintage', 'numistaNumber', 'ocreId', 'legendObv', 'legendRev'];
    const q = searchQuery.trim().toLowerCase();
const visibleCoins = q && viewCoins
        ? viewCoins.filter(c => searchFields.some(f => (c[f] || '').toString().toLowerCase().includes(q)))
        : viewCoins;

    // --- Pagination (client-side, 20 per page) ---
    const PAGE_SIZE = 20;
    const [pageCount, setPageCount] = useState(1);
    // Reset page when view or search changes
    useEffect(() => {
        setPageCount(1);
    }, [view, searchQuery]);
    const displayedCoins = visibleCoins ? visibleCoins.slice(0, pageCount * PAGE_SIZE) : null;
    const hasMore = visibleCoins && visibleCoins.length > displayedCoins?.length;

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
    navigate(
      coin.numistaNumber ? `/create/${coin.numistaNumber}` : "/create",
      { state: { ...coin, _id: undefined, ...(coin.isManual ? { manualMode: true } : {}) } }
    );
  };

  const handleFormSubmit = (e) => {
    if (e) e.preventDefault();
    let val = lookupValue.trim();
    if (!val) return;
    // Strip URLs: extract the OCRE/Numista ID from a pasted URL
    if (val.includes('numismatics.org/ocre/id/')) {
      val = val.split('numismatics.org/ocre/id/').pop().split(/[?#]/)[0];
    } else if (val.includes('en.numista.com/catalogue/pieces')) {
      val = val.split('pieces').pop().replace(/[^0-9]/g, '');
    }
    if (lookupMode === 'numista') {
      navigate('/create/' + val.replace(/\D+/g, ''));
    } else {
      navigate('/create', { state: { ocreId: val, manualMode: true } });
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

      {/* Entry box — coloured, visually distinct from the list */}
      <Paper withBorder radius="md" p="md" mb="lg" shadow="xs" bg="blue.0" style={{ borderColor: 'var(--mantine-color-blue-2)' }}>
        <Group align="center" gap="md" wrap="wrap">
          <form onSubmit={handleFormSubmit} style={{ flex: '1 1 auto', minWidth: 0 }}>
            <Group gap={0} wrap="nowrap" align="stretch">
              <Box
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0 10px',
                  background: 'var(--mantine-color-blue-1)',
                  borderTopLeftRadius: 'var(--mantine-radius-default)',
                  borderBottomLeftRadius: 'var(--mantine-radius-default)',
                  border: '1px solid var(--mantine-color-blue-3)',
                  borderRight: 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                onClick={() => setLookupMode(lookupMode === 'numista' ? 'ocre' : 'numista')}
                title={`Switch to ${lookupMode === 'numista' ? 'OCRE' : 'Numista'} lookup`}
              >
                {lookupMode === 'numista' ? (
                  <Text size="sm" fw={700} c="blue.8">N#</Text>
                ) : (
                  <Group gap={4} wrap="nowrap">
                    <ScrollText size={14} />
                    <Text size="sm" fw={700} c="blue.8">OCRE</Text>
                  </Group>
                )}
              </Box>
              <TextInput
                value={lookupValue}
                onChange={(e) => setLookupValue(e.target.value)}
                onPaste={(e) => {
                    const pasted = e.clipboardData.getData('text');
                    let val = pasted.trim();
                    if (val.includes('numismatics.org/ocre/id/')) {
                        val = val.split('numismatics.org/ocre/id/').pop().split(/[?#]/)[0];
                    } else if (val.includes('en.numista.com/catalogue/pieces')) {
                        val = val.split('pieces').pop().replace(/[^0-9]/g, '');
                    }
                    if (val !== pasted.trim()) {
                        e.preventDefault();
                        setLookupValue(val);
                    }
                }}
                placeholder={lookupMode === 'numista' ? 'Numista number...' : 'e.g. ric.2_3(2).hdn.1907'}
                style={{ flex: 1, minWidth: 0 }}
                styles={{ input: { borderRadius: 0 } }}
              />
              <Button type="submit" px="md" style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
                Go
              </Button>
            </Group>
          </form>

          <Box visibleFrom="md" style={{ width: 1, height: 36, background: 'var(--mantine-color-blue-2)', flexShrink: 0 }} />

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

      {/* View toggle */}
      <Group mb="sm" gap="xs">
        <Button
          variant={view === 'labels' ? 'filled' : 'default'}
          size="xs"
          onClick={() => { setView('labels'); setSelectedCoins({}); }}
        >
          My Labels {activeCoins ? `(${activeCoins.length})` : ''}
        </Button>
        <Button
          variant={view === 'cached' ? 'filled' : 'default'}
          color={view === 'cached' ? 'yellow' : undefined}
          size="xs"
          leftSection={<Archive size={13} />}
          onClick={() => { setView('cached'); setSelectedCoins({}); }}
        >
          Cached Labels {cachedCoins && cachedCoins.length > 0 ? `(${cachedCoins.length})` : ''}
        </Button>
      </Group>

      {/* Search — sits right above the list */}
      <TextInput
        placeholder="Search — issuer, year, grade, details, composition, reference…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        mb="md"
        leftSection={<Search size={14} />}
        rightSectionPointerEvents="all"
        rightSection={searchQuery ? (
          <X size={14} style={{ cursor: 'pointer' }} onClick={() => setSearchQuery("")} />
        ) : undefined}
      />

      {/* Action Bar */}
      {selectedIds.length > 0 && (
        <Box mb="lg" style={{ position: 'sticky', top: 10, zIndex: 1020 }}>
          <Paper shadow="md" radius="md" p="xs" withBorder maw={640} mx="auto">
            <Group justify="center" gap="xs" wrap="wrap">
              <Button size="xs" onClick={handlePrintSelected} leftSection={<Printer size={13} />}>
                Print Selected ({selectedIds.length})
              </Button>
              {view === 'labels' ? (
                <Button size="xs" variant="default" onClick={() => handleBulkCache(true)} leftSection={<Archive size={13} />}>
                  Cache Selected
                </Button>
              ) : view === 'cached' ? (
                <Button size="xs" variant="default" onClick={() => handleBulkCache(false)} leftSection={<ArchiveRestore size={13} />}>
                  Restore Selected
                </Button>
              ) : null}
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
        {hasVisible && view !== 'collection' && (
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
        ) : collectionLoading ? (
          <SimpleGrid cols={{ base: 1, xs: 2, sm: 2, md: 3 }} spacing="sm">
            {[...Array(Math.min(collectionCount, 6))].map((_, i) => (
              <Card key={i} withBorder shadow="sm" padding={0}>
                <Skeleton style={{ aspectRatio: '2.2' }} />
                <Box p="sm">
                  <Skeleton height={14} width="70%" radius="sm" mb={6} />
                  <Skeleton height={11} width="50%" radius="sm" />
                </Box>
              </Card>
            ))}
          </SimpleGrid>
        ) : !hasVisible ? (
          <Stack align="center" my="xl" gap={4}>
            <Box style={{ color: 'var(--mantine-color-gray-5)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                <path d="M8 13A5 5 0 1 1 8 3a5 5 0 0 1 0 10zm0 1A6 6 0 1 0 8 2a6 6 0 0 0 0 12z" />
                <path d="M8 11a3 3 0 1 1 0-6a3 3 0 0 1 0 6z" />
              </svg>
            </Box>
            {q ? (
              <Text size="lg" c="dimmed" mt="sm">No results for "{searchQuery}"</Text>
            ) : view === 'cached' ? (
              <Text size="lg" c="dimmed" mt="sm">There are no cached labels.</Text>
            ) : view === 'collection' ? (
              <>
                <Text size="lg" c="dimmed" mt="sm">No collection items yet</Text>
                <Text c="dimmed">Check "Save to collection" when creating a label to track items here.</Text>
              </>
            ) : (
              <>
                <Text size="lg" c="dimmed" mt="sm">No labels yet</Text>
                <Text c="dimmed">Start by adding your first coin to see it here.</Text>
              </>
            )}
          </Stack>
        ) : view === 'collection' ? (
          <SimpleGrid cols={{ base: 1, xs: 2, sm: 2, md: 3 }} spacing="sm">
            {coins === null ? (
              [1, 2, 3, 4, 6, 8].map(i => (
                <Card key={i} withBorder shadow="sm" padding={0}>
                  <Skeleton style={{ aspectRatio: '2.2' }} />
                  <Box p="sm">
                    <Skeleton height={14} width="70%" radius="sm" mb={6} />
                    <Skeleton height={11} width="50%" radius="sm" />
                  </Box>
                </Card>
              ))
            ) : (
            displayedCoins.map((coin) => {
              const isSelected = !!selectedCoins[coin._id];
              return (
                <Card
                    key={coin._id}
                    withBorder
                    shadow="sm"
                    padding={0}
                    style={{
                      cursor: 'pointer',
                      overflow: 'hidden',
                      transition: 'box-shadow 0.15s, transform 0.15s, border-color 0.15s',
                      borderColor: isSelected ? 'var(--mantine-color-green-6)' : undefined,
                    }}
                    onClick={() => navigate(`/item/${coin._id}`)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--mantine-color-green-6)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isSelected ? 'var(--mantine-color-green-6)' : 'var(--mantine-color-gray-3)';
                      e.currentTarget.style.boxShadow = 'var(--mantine-shadow-sm)';
                    }}
                  >
                    <Box
                      style={{
                        aspectRatio: '2.2',
                        background: 'var(--mantine-color-gray-1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        position: 'relative',
                        padding: '6px',
                        boxSizing: 'border-box',
                      }}
                    >
                      {coin.hasObvImage || coin.hasRevImage ? (
                        <Group gap={6} wrap="nowrap" align="center" style={{ width: '100%', height: '100%' }}>
                          {coin.hasObvImage && (
                            <img
                              src={coinImageUrl(coin, 'obv')}
                              alt="Obv"
                              onError={e => { e.currentTarget.style.display = 'none'; }}
                              style={{ flex: 1, minWidth: 0, maxHeight: '100%', objectFit: 'contain' }}
                            />
                          )}
                          {coin.hasRevImage && (
                            <img
                              src={coinImageUrl(coin, 'rev')}
                              alt="Rev"
                              onError={e => { e.currentTarget.style.display = 'none'; }}
                              style={{ flex: 1, minWidth: 0, maxHeight: '100%', objectFit: 'contain' }}
                            />
                          )}
                        </Group>
                      ) : (
                        <Text size="xl" c="gray.4">🪙</Text>
                      )}
                      {coin.grade && (
                        <Badge
                          size="xs"
                          variant="filled"
                          color="blue"
                          style={{ position: 'absolute', bottom: 6, right: 6 }}
                        >
                          {coin.grade}
                        </Badge>
                      )}
                    </Box>

                    <Box p="sm">
                      <Text fw={700} size="xs" lineClamp={1}>
                        {coin.issuer} {coin.denomination}
                      </Text>
                      <Text size="xs" c="dimmed" lineClamp={1}>
                        {coin.year || '—'}{coin.reference ? ` · ${coin.reference}` : ''}
                      </Text>
                    </Box>
                  </Card>
              );
            })
            )}
          </SimpleGrid>
        ) : (
          <Stack gap="lg">
            {displayedCoins.map((coin) => {
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
<Text
                            fw={700} tt="uppercase" style={{ letterSpacing: '0.5px', flex: 1, cursor: view === 'collection' ? 'pointer' : 'default' }}
                            onClick={(e) => {
                                if (view === 'collection') {
                                    e.stopPropagation();
                                    navigate(`/item/${coin._id}`);
                                }
                            }}
                        >
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
                          {view === 'collection' && (coin.collectionObvImage || coin.collectionRevImage) && (
                            <Group gap="xs">
                              {coin.collectionObvImage && (
                                <img src={coin.collectionObvImage} alt="Obv"
                                  style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }} />
                              )}
                              {coin.collectionRevImage && (
                                <img src={coin.collectionRevImage} alt="Rev"
                                  style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }} />
                              )}
                            </Group>
                          )}
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
                            to={coin.numistaNumber ? `/create/${coin.numistaNumber}` : "/create"}
                            state={{ coinId: coin._id, ...(coin.isManual ? { manualMode: true } : {}) }}
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

        {hasMore && (
          <Group justify="center" mt="lg" mb="xl">
            <Button variant="default" onClick={() => setPageCount(p => p + 1)}>
              Load more ({visibleCoins.length - displayedCoins.length} remaining)
            </Button>
          </Group>
        )}
      </div>
    </Container>
  );
};

export default Home;
