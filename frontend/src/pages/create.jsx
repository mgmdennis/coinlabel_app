import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { Button, Container, Grid, Group, Modal, Text, TextInput } from '@mantine/core';
import { ProvenanceCard } from '../components/ProvenanceCard';
import { notifications } from '@mantine/notifications';
import { notifySaveFailure as notifySaveFailureShared, clearSaveFailureToast as clearSaveFailureToastShared } from '../utils/saveFailureToast';

import { BASE_URL } from '../config';

// Utilities
import { parseNumistaText } from "../utils/parseNumistaText";
import { extractLookupValue } from "../utils/lookup";
import { formatObverse } from "../utils/condenseDetails";

// Components
import { AIConfirmModal } from "../components/AIConfirmModal";
import { CreateHeader } from "../components/CreateHeader";
import { ManualModeToggle } from "../components/ManualModeToggle";
import { CollectionSettingsCard } from "../components/CollectionSettingsCard";
import { NumistaDataCard } from "../components/NumistaDataCard";
import { LabelSpecificsCard } from "../components/LabelSpecificsCard";
import { PasteNumistaAccordion } from "../components/PasteNumistaAccordion";
import { VisualCustomizationCard } from "../components/VisualCustomizationCard";
import { PreviewCard } from "../components/PreviewCard";

// sessionStorage key holding an unsaved entry stashed when the session
// expired mid-entry (offered back via the "Resume unsaved draft?" modal).
const DRAFT_KEY = "numistag-create-draft";

// True when the record holds no data at all beyond the bare lookup key — the
// kind of auto-created stub that litters the collection when a page is opened
// and abandoned (or the catalogue fetch failed/never populated). Data the
// lookup actually RETURNED counts as content (Mark, 2026-11-21): a Numista or
// OCRE entry auto-filled with year/issuer/denomination/etc. is a real record
// and is kept even if the user never curated it. In manual mode everything is
// typed, so everything counts. Collection-linked labels are never considered
// empty.
const isEmptyCoinPayload = (p) => {
    if (!p) return true;
    if (p.isCollectionItem) return false;
    if (Array.isArray(p.marks) && p.marks.length) return false;
    const typed = p.isManual
        ? [p.numistaNumber, p.ocreId, p.year, p.issuer, p.denomination, p.grade,
           p.gradeDetails, p.details, p.provenance, p.reference, p.composition,
           p.physicalDetails,
           p.mintage, p.legendObv, p.legendRev, p.collectionObvImage,
           p.collectionRevImage, p.sketchId, p.marksPicture]
        : [p.year, p.issuer, p.denomination, p.grade, p.gradeDetails, p.details,
           p.provenance, p.reference, p.composition, p.physicalDetails, p.mintage,
           p.legendObv, p.legendRev, p.collectionObvImage, p.collectionRevImage,
           p.sketchId, p.marksPicture];
    return !typed.some(v => v && String(v).trim());
};

const Create = () => {
    const { numistaNumber: paramNumistaNumber } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // --- App State ---
    const [numistaNumber, setNumistaNumber] = useState(
        (location?.state?.manualMode) ? "" : (paramNumistaNumber || "")
    );
    const [numistaDetails, setNumistaDetails] = useState({});
    const [numistaTitle, setNumistaTitle] = useState("");
    const [coinId, setCoinId] = useState(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const lastLoadedCoinId = useRef(null);
    const [title, setTitle] = useState("");
    const [isManualMode, setIsManualMode] = useState(location?.state?.manualMode || false);
    const [numistaError, setNumistaError] = useState("");
    const [pastedImage, setPastedImage] = useState(null);

    // --- Label Field State ---
    const [year, setYear] = useState("");
    const [details, setDetails] = useState("");
    // Free-text provenance — never auto-filled by lookups; printed on the
    // inside of the folded booklet (print.jsx duplex verso). (2026-11-21)
    const [provenance, setProvenance] = useState("");
    const [detailsWidth, setDetailsWidth] = useState(45);
    const [denomination, setDenomination] = useState("");
    const [grade, setGrade] = useState("");
    const [gradeDetails, setGradeDetails] = useState("");
    const [issuer, setIssuer] = useState("");
    const [reference, setReference] = useState("");
    // WildWinds page that sourced the RSC/BMC concordance lines (OCRE lookups
    // only) — surfaced as a verify-before-printing link on the preview card.
    const [concordanceSource, setConcordanceSource] = useState(null);
    const [mintage, setMintage] = useState("");
    const [composition, setComposition] = useState("");
    const [physicalDetails, setPhysicalDetails] = useState("");
    // In manual mode these three fields drive `physicalDetails` for display/print.
    const [mass, setMass] = useState("");
    const [diameter, setDiameter] = useState("");
    const [orientation, setOrientation] = useState("");
    const [showDiameterWarning, setShowDiameterWarning] = useState(false);
    const [legendObv, setLegendObv] = useState("");
    const [legendRev, setLegendRev] = useState("");
    const [isCollectionItem, setIsCollectionItem] = useState(false);
    const [collectionObvImage, setCollectionObvImage] = useState("");
    const [collectionRevImage, setCollectionRevImage] = useState("");
    const [ocreId, setOcreId] = useState("");
    const [ocreError, setOcreError] = useState("");
    const [dateAdded, setDateAdded] = useState("");
    const [marksPicture, setMarksPicture] = useState(null);
    const [marks, setMarks] = useState([]);

    const [swapDate, setSwapDate] = useState(true);

    // --- Visual Selection State ---
    const [visualTarget, setVisualTarget] = useState("QR");
    const [visualMethod, setVisualMethod] = useState("SCRIPT");
    const [numistaSide, setNumistaSide] = useState("OBVERSE");
    const [sketchId, setSketchId] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingQR, setIsGeneratingQR] = useState(false);
    const [showAIConfirm, setShowAIConfirm] = useState(false);
    const [isPremiumAI, setIsPremiumAI] = useState(false);
    const [pasteText, setPasteText] = useState("");
    const [userChangedVisualTarget, setUserChangedVisualTarget] = useState(false);

    // --- Save Status State ---
    const [saveStatus, setSaveStatus] = useState("saved"); // 'saving', 'saved', 'error'

    // Unsaved draft stashed by the session-expiry watchdog — offer to restore
    // it before anything auto-creates a fresh record.
    const [draftAvailable, setDraftAvailable] = useState(() => {
        try {
            return !isEmptyCoinPayload(JSON.parse(sessionStorage.getItem(DRAFT_KEY)));
        } catch {
            return false;
        }
    });

    // --- Logic Functions ---

    // Compose the physicalDetails string shown in the preview / stored in DB
    // from the three separate manual-mode fields. Keeps the on-label format
    // identical to what the Numista loader produces:
    //   <orientation>\n⌀ <diameter> mm\n<mass> g
    const composePhysicalDetails = (m = mass, d = diameter, o = orientation) => {
        const lines = [];
        if (o) lines.push(o);
        if (d) lines.push(`⌀ ${d} mm`);
        if (m) lines.push(`${m} g`);
        setPhysicalDetails(lines.join('\n'));
    };

    // Split an existing physicalDetails string (e.g. a loaded manual coin or a
    // non-manual coin being switched to manual mode) back into the three fields.
    const splitPhysicalDetails = (pd) => {
        if (!pd) return;
        const m = pd.match(/([\d.]+)\s*g/);
        const d = pd.match(/⌀\s*([\d.]+)/);
        const o = pd.match(/[↑↓←→]+/);
        setMass(m?.[1] || "");
        setDiameter(d?.[1] || "");
        setOrientation(o?.[0] || "");
    };

    // Max supported coin diameter in mm (matches BackLabelContainer cap).
    const MAX_DIAMETER = 45.5;

    // Manual-mode setters: update their own field state and re-compose physicalDetails.
    const handleMassChange = (e) => { const v = e.target.value; setMass(v); composePhysicalDetails(v, diameter, orientation); };
const handleDiameterChange = (e) => {
        const v = e.target.value;
        const num = parseFloat(v);
        if (v && !isNaN(num) && num > MAX_DIAMETER) {
            // Reject values above the cap — clearing the field keeps the
            // preview/print pipeline out of the error state. Show an
            // explanation modal so the user understands why it was cleared.
            setDiameter("");
            composePhysicalDetails(mass, "", orientation);
            setShowDiameterWarning(true);
            return;
        }
        setDiameter(v);
        composePhysicalDetails(mass, v, orientation);
    };
    const handleOrientationChange = (e) => { const v = e.target.value; setOrientation(v); composePhysicalDetails(mass, diameter, v); };

    const updateFillOutDateAndDetails = (variation, description, useDate = swapDate) => {
        if (!variation) return;
        if (useDate) setYear(variation.date);
        setMintage(variation.mintage.length > 0 ? `m. ${variation.mintage}` : "");
        setMarksPicture(variation.marks_picture || null);
        setMarks(variation.marks || []);

        let comments = variation.comment || "";
        if (comments.includes("Proof")) {
            setGrade("Proof");
            comments = comments.replace("Proof", "").trim();
        }
        setDetails(comments.length > 0 ? `${comments}\n${description}` : description);
    };

    // Only overwrite label fields if forceOverwrite is true (reset or new coin)
    const updateNumistaDetails = (jsonData, forceOverwrite = false) => {
        setNumistaDetails(jsonData); // Always update for dropdowns, etc.
        setNumistaTitle(jsonData.title || ""); // Always update for UI population
        if (forceOverwrite) {
            setTitle(jsonData.title);
            setDenomination(jsonData.denomination);
            setIssuer(jsonData.issuer);
            setComposition(jsonData.composition);
            setPhysicalDetails(`${jsonData.orientation || ''}\n⌀ ${jsonData.diameter || ''}\n${jsonData.mass || ''}`);
            // Pre-fill legends from Numista so users can flip on the
            // "Legends" visual target without re-typing anything.
            setLegendObv(jsonData.obverseLettering || "");
            setLegendRev(jsonData.reverseLettering || "");
            // Reset dateAdded to today
            const currentDate = new Date();
            const formattedDate = `${currentDate.getFullYear()}-${currentDate.toLocaleString('default', { month: 'short' }).toUpperCase()}-${String(currentDate.getDate()).padStart(2, '0')}`;
            setDateAdded(formattedDate);
            if (jsonData.variations?.length > 0) {
                updateFillOutDateAndDetails(jsonData.variations[0], jsonData.description);
            }
            // Numista references are primary-source; no WildWinds concordance applies.
            setConcordanceSource(null);
            if (jsonData.references?.length > 0) {
                setReference(jsonData.references[0]);
            }
        }
    };

    // --- UNIFIED GENERATION: AI, SCRIPT, and RAW ---
    const handleGenerateVisual = async () => {
        if (visualMethod === "AI" && !showAIConfirm) {
            setShowAIConfirm(true);
            return;
        }

        setShowAIConfirm(false);
        setIsGenerating(true);

        let imageData = null;   // base64 for pasted images
        let imageUrl = null;    // raw URL for Numista images (backend fetches via relay)
        let side = null;

        if (visualTarget === 'PASTED') {
            if (!pastedImage) {
                alert(`Please paste an image from your clipboard first.`);
                setIsGenerating(false);
                return;
            }
            imageData = pastedImage;
            side = 'PASTED';
        } else if (visualTarget === 'NUMISTA') {
            side = numistaSide; // OBVERSE or REVERSE
            const imgSource = numistaSide === "OBVERSE"
                ? numistaDetails.obverseImage
                : numistaDetails.reverseImage;

            if (!imgSource) {
                alert(`No ${numistaSide.toLowerCase()} image is available from Numista.`);
                setIsGenerating(false);
                return;
            }
            imageUrl = imgSource; // Send URL — backend will fetch it
        } else {
            // QR / GALLERY shouldn't reach here
            setIsGenerating(false);
            return;
        }

        await generateSketch({ imageData, imageUrl, side });
        setIsGenerating(false);
    };

    const generateSketch = async ({ imageData, imageUrl, side }) => {
        try {
            // Extract coin diameter in mm (default to 25 if not available)
            const coinDiameter = numistaDetails.diameter
                ? parseFloat(numistaDetails.diameter.match(/[\d.]+/)?.[0] || '25')
                : 25;

            // Determine if this coin has multiple date variations
            const hasDates = numistaDetails.variations && numistaDetails.variations.length > 1;

            console.log(`🎯 Generating sketch - Year: "${year}", HasDates: ${hasDates}, Side: ${side}, Method: ${visualMethod}`);

            const requestBody = {
                numistaNumber,
                method: visualMethod,
                coinDiameter,
                year,
                side,
                hasDates,
                swapDate,
                premium: isPremiumAI,
                ...(imageData && { imageData }),
                ...(imageUrl && { imageUrl }),
            };

            console.log(`📤 Sending request body:`, {
                numistaNumber: requestBody.numistaNumber,
                method: requestBody.method,
                year: requestBody.year,
                side: requestBody.side,
                hasDates: requestBody.hasDates,
                coinDiameter: requestBody.coinDiameter,
                hasImageData: !!requestBody.imageData,
                hasImageUrl: !!requestBody.imageUrl,
            });

            // Send to the unified backend route.
            // POST timeout is short: creating a Replicate prediction (AI) or
            // doing the SCRIPT/RAW image processing should both finish in <30s.
            // The full budget for polling AI results is `sketchTimeout` below.
            const sketchTimeout = isPremiumAI ? 120000 : 60000;  // Total budget incl. polling
            const res = await axios.post(`${BASE_URL}/generate-sketch`, requestBody, { timeout: 30000 });

            console.log("Backend Response:", res.data);

            if (res.data.status === 'pending') {
                // Backend created a job (Replicate prediction for AI, background
                // worker for SCRIPT/RAW) and returned immediately. Poll
                // /status/:id until it completes or fails.
                // Each poll is a quick round-trip; total budget stays inside
                // `sketchTimeout` (120s premium / 60s standard). This avoids
                // Heroku's 30s H12 router timeout that kills one-shot blocking
                // calls while still enforcing a wall-clock limit client-side.
                const pendingId = res.data.sketchId;
                const startedAt = Date.now();
                const pollInterval = 3000;
                const pollTimeout = 15000;
                while (Date.now() - startedAt < sketchTimeout) {
                    await new Promise(r => setTimeout(r, pollInterval));
                    const pollRes = await axios.get(`${BASE_URL}/generate-sketch/status/${pendingId}`, { timeout: pollTimeout });
                    const s = pollRes.data.status;
                    console.log(`Poll status for ${pendingId}: ${s}`);
                    if (s === 'completed') { setSketchId(pendingId); return; }
                    if (s === 'failed') { alert("Generation failed: " + (pollRes.data.error || 'unknown')); return; }
                    // 'pending' → keep polling
                }
                alert("Generation timed out — the backend did not finish in time. Please try again.");
                return;
            }

            // Cached completed sketch returned synchronously
            setSketchId(res.data.sketchId);
        } catch (err) {
            console.error("Failed to generate visual:", err);
            alert("Error generating image. Ensure your backend proxy is running.");
        } finally {
            // Spinners are now controlled in handleGenerateVisual
        }
    };

    // --- Handle Text Parsing ---
    const handleParseText = () => {
        parseNumistaText(
            pasteText,
            setNumistaNumber,
            setIssuer,
            setYear,
            setComposition,
            setMass,
            setDiameter,
            setOrientation,
            setPhysicalDetails,
            setReference,
            setDenomination
        );
        setPasteText("");
        notifications.show({ message: "Data extracted and populated!", color: 'green' });
    };

    // --- API Interactions ---

    const isCreatingCoin = useRef(false);

    // Snapshot of the last successfully saved payload. Auto-saves diff against
    // it so unchanged fields — especially the heavy base64 photos — are never
    // re-sent on every keystroke-level save.
    const lastSavedRef = useRef(null);

    const buildPayload = useCallback(() => ({
        numistaNumber, ocreId, year, issuer, denomination, grade, gradeDetails,
        details, provenance, reference, composition, physicalDetails, mintage, dateAdded, marksPicture, marks,
        visualTarget, visualMethod, sketchId, isManual: isManualMode,
        detailsWidth,
        legendObv, legendRev,
        isCollectionItem, collectionObvImage, collectionRevImage
    }), [numistaNumber, ocreId, year, issuer, denomination, grade, gradeDetails, details, provenance, reference, composition, physicalDetails, mintage, dateAdded, marksPicture, marks, visualTarget, visualMethod, sketchId, isManualMode, detailsWidth, legendObv, legendRev, isCollectionItem, collectionObvImage, collectionRevImage]);

    // Latest-values mirrors for leave-page cleanup / draft stash (the unmount
    // cleanup and pagehide handlers must never fire on a stale closure).
    const coinIdRef = useRef(null);
    const payloadRef = useRef(null);
    // Set once the user has chosen to leave/discard — suppresses the empty
    // cleanup and tells an in-flight auto-create to undo itself.
    const discardedRef = useRef(false);
    coinIdRef.current = coinId;
    payloadRef.current = buildPayload();

    const diffAgainstSnapshot = (payload) => {
        const snapshot = lastSavedRef.current;
        const changed = {};
        for (const key of Object.keys(payload)) {
            const curr = payload[key];
            const prev = snapshot ? snapshot[key] : undefined;
            const isEqual = Array.isArray(curr) || Array.isArray(prev)
                ? JSON.stringify(curr) === JSON.stringify(prev)
                : curr === prev;
            if (!isEqual) changed[key] = curr;
        }
        return changed;
    };

    // Sticky toast for failed saves — extracted to utils/saveFailureToast.js
    // so the collection item page's autosave shares the exact same behavior.
    const notifySaveFailure = notifySaveFailureShared;
    const clearSaveFailureToast = clearSaveFailureToastShared;

    const createCoin = useCallback((overridePayload) => {
        if (isCreatingCoin.current) return;
        isCreatingCoin.current = true;
        const payload = overridePayload || buildPayload();
        axios.post(`${BASE_URL}/coin/new`, payload)
        .then((res) => {
            // User left the page (or discarded) while this POST was in flight
            // and the entry is empty — don't leave the stub behind.
            if (discardedRef.current && isEmptyCoinPayload(payload)) {
                axios.delete(`${BASE_URL}/coin/delete/${res.data._id}`).catch(() => {});
                isCreatingCoin.current = false;
                return;
            }
            lastSavedRef.current = payload;
            setCoinId(res.data._id);
            setInitialLoadComplete(true);
            clearSaveFailureToast();
        })
        .catch((err) => {
            console.error("Error creating coin:", err);
            notifySaveFailure(err);
            isCreatingCoin.current = false;
        });
    }, [buildPayload]);

    // Self-reference for the retry loop below (a useCallback can't close over
    // itself); also cleared when the page unmounts.
    const updateCoinRemoteRef = useRef(null);
    const saveRetryTimer = useRef(null);

    const updateCoinRemote = useCallback(() => {
        if (!coinId) return;
        const changed = diffAgainstSnapshot(buildPayload());
        if (!Object.keys(changed).length) { setSaveStatus("saved"); return; }
        setSaveStatus("saving");
        axios.put(`${BASE_URL}/coin/update/${coinId}`, changed)
        .then(() => {
            lastSavedRef.current = { ...(lastSavedRef.current || {}), ...changed };
            setSaveStatus("saved");
            clearSaveFailureToast();
            if (saveRetryTimer.current) { clearTimeout(saveRetryTimer.current); saveRetryTimer.current = null; }
            console.log("Auto-saved fields:", Object.keys(changed).join(", "));
        })
        .catch((err) => {
            setSaveStatus("error");
            console.error("Error updating coin:", err);
            notifySaveFailure(err);
            // Retry the current diff every 5s so pending edits really DO go
            // through once the connection (or backend) is back — the retry
            // re-diffs, so newer keystrokes ride along. A 401 means the
            // session died while we were offline: the expiry bounce handles
            // it, no point hammering a dead session.
            if (err?.response?.status === 401) return;
            if (saveRetryTimer.current) clearTimeout(saveRetryTimer.current);
            saveRetryTimer.current = setTimeout(() => updateCoinRemoteRef.current?.(), 5000);
        });
    }, [coinId, buildPayload]);
    updateCoinRemoteRef.current = updateCoinRemote;

    // --- Effects ---

    useEffect(() => {
        const handlePaste = (event) => {
            // Allow pasting images in manual mode OR when PASTED target is selected
            if (!isManualMode && visualTarget !== 'PASTED') return;

            const items = (event.clipboardData || event.originalEvent.clipboardData).items;
            for (let index in items) {
                const item = items[index];
                if (item.kind === 'file' && item.type.startsWith('image/')) {
                    const blob = item.getAsFile();
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        setPastedImage(e.target.result); // Keep base64 for display and processing
                    };
                    reader.readAsDataURL(blob);
                    event.preventDefault(); // Prevent the image from being pasted elsewhere
                    break; // We only handle the first image file we find
                }
            }
        };

        window.addEventListener('paste', handlePaste);

        return () => {
            window.removeEventListener('paste', handlePaste);
        };
    }, [isManualMode, visualTarget]); // Rerun if isManualMode or visualTarget changes

    // --- Catalogue Lookup (OCRE / CRRO / HRC family) ---
    const MATERIAL_MAP = {
        'ar': 'Silver', 'av': 'Gold', 'ae': 'Bronze', 'orichalcum': 'Brass',
        'cu': 'Copper', 'billon': 'Billon', 'lead': 'Lead', 'electrum': 'Electrum',
    };
    const mapMaterial = (m) => MATERIAL_MAP[m?.toLowerCase()] || m || "";

    // Id prefixes are disjoint per catalogue, so the id routes the fetch,
    // the form's issuer value, and the "View on …" link. API paths:
    // OCRE/CRRO are flat routes, the HRC family goes through /hrc/:dataset.
    const CATALOGS = {
        ocre: { apiPath: 'ocre', label: 'OCRE', issuer: 'Roman Empire',
            url: (id) => `https://numismatics.org/ocre/id/${id}` },
        crro: { apiPath: 'crro', label: 'CRRO', issuer: 'Roman Republic',
            url: (id) => `https://numismatics.org/crro/id/${id}` },
        sco: { apiPath: 'hrc/sco', label: 'SCO', issuer: 'Seleucid Kingdom',
            url: (id) => `https://numismatics.org/sco/id/${id}` },
        pella: { apiPath: 'hrc/pella', label: 'PELLA', issuer: 'Macedonian Kingdom',
            url: (id) => `https://numismatics.org/pella/id/${id}` },
        pco: { apiPath: 'hrc/pco', label: 'PCO', issuer: 'Ptolemaic Kingdom',
            url: (id) => `https://numismatics.org/pco/id/${id}` },
        agco: { apiPath: 'hrc/agco', label: 'AGCO', issuer: 'Antigonid Kingdom',
            url: (id) => `https://numismatics.org/agco/id/${id}` },
    };

    const datasetFor = (id) => {
        if (/^rrc-/i.test(id)) return 'crro';
        if (/^sc\./i.test(id)) return 'sco';
        if (/^price\./i.test(id)) return 'pella';
        if (/^cpe\./i.test(id)) return 'pco';
        if (/^newell\./i.test(id)) return 'agco';
        return 'ocre';
    };

    const handleOcreLookup = (idArg) => {
        const id = (idArg || ocreId).trim();
        if (!id) return;
        setOcreId(id);
        setOcreError("");
        const cat = CATALOGS[datasetFor(id)];
        axios.get(`${BASE_URL}/${cat.apiPath}/${encodeURIComponent(id)}`)
            .then((res) => {
                const d = res.data;
                setTitle(d.title || "");
                setIssuer(cat.issuer);
                setDenomination(d.denomination || "");
                setComposition(mapMaterial(d.material));
                setReference(d.reference || "");
                setYear(d.year || "");
                // Full words by default — the label abbreviates at display
                // time only when the text won't fit or grade notes are set.
                // Backend delivers the ruler/effigy-aware obverse block.
                const obv = d.obverseText || formatObverse(d.obverseDescription);
                const rev = d.reverseDescription ? `Rev: ${d.reverseDescription}` : "";
                const mint = d.mint ? `Mint: ${d.mint}` : "";
                setDetails([obv, rev, mint].filter(Boolean).join('\n'));
                setLegendObv(d.obverseLegend || "");
                setLegendRev(d.reverseLegend || "");
                if (visualTarget === 'QR' && (d.obverseLegend || d.reverseLegend)) {
                    setVisualTarget('LEGENDS');
                }
                setPhysicalDetails("");
                setMass("");
                setDiameter("");
                setOrientation("");
                const currentDate = new Date();
                const formattedDate = `${currentDate.getFullYear()}-${currentDate.toLocaleString('default', { month: 'short' }).toUpperCase()}-${String(currentDate.getDate()).padStart(2, '0')}`;
                setDateAdded(formattedDate);
                setConcordanceSource(d.concordance?.sourceUrl || null);
            })
            .catch((err) => {
                const message = err.response?.data?.error || `Failed to fetch ${cat.label} data.`;
                setOcreError(message);
                setConcordanceSource(null);
            });
    };

    // Auto-load OCRE data if navigated with state.ocreId
    useEffect(() => {
        const ocreIdParam = location?.state?.ocreId;
        if (ocreIdParam && !isManualMode) {
            setIsManualMode(true);
        }
        if (ocreIdParam) {
            handleOcreLookup(ocreIdParam);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location]);

    // File picker handler — same pipeline as clipboard paste (iOS fallback)
    const handleImageFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => setPastedImage(e.target.result);
        reader.readAsDataURL(file);
    };

    // When switching to manual mode, reset visual target appropriately
    useEffect(() => {
        if (isManualMode && visualTarget === 'NUMISTA') {
            setVisualTarget('QR');
        }
    }, [isManualMode, visualTarget]);

    // When entering manual mode, seed the three physical-detail fields from
    // whatever physicalDetails already holds (e.g. data loaded from a Numista
    // coin before toggling, or a previously-saved manual coin). Only runs the
    // seed when all three fields are empty so we never clobber user input.
    useEffect(() => {
        if (isManualMode && !mass && !diameter && !orientation && physicalDetails) {
            splitPhysicalDetails(physicalDetails);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isManualMode]);

    // Default "Save to collection" based on mode — manual entries are collection
    // items by default; Numista labels are throwaway by default. Only set the
    // default once (on first mount or mode switch), never clobber user choice.
    useEffect(() => {
        setIsCollectionItem(isManualMode);
    }, [isManualMode]);

    useEffect(() => {
        const currentDate = new Date();
        const formattedDate = `${currentDate.getFullYear()}-${currentDate.toLocaleString('default', { month: 'short' }).toUpperCase()}-${String(currentDate.getDate()).padStart(2, '0')}`;
        setDateAdded(formattedDate);
        // Only fetch from Numista if not in manual mode
        if (!isManualMode && paramNumistaNumber) {
            setNumistaError("");
            axios.get(`${BASE_URL}/numista/${paramNumistaNumber}`)
                .then((res) => {
                    // Only overwrite fields if this is a new coin (not editing)
                    const editCoinId = location?.state?.coinId;
                    updateNumistaDetails(res.data, !editCoinId);
                })
                .catch((err) => {
                    const message = err.response?.data?.error || "Failed to load coin data from Numista.";
                    console.error("Numista fetch error:", message);
                    setNumistaError(message);
                    setTitle("Error");
                });
        } else if (isManualMode) {
            // In manual mode, set placeholder values
            setTitle("Manual Entry");
            setInitialLoadComplete(true);
        }
    }, [paramNumistaNumber, isManualMode, location]);

    // Load coin data when editing (works for both manual and API coins)
    useEffect(() => {
        const editCoinId = location?.state?.coinId;
        // If coinId changes, reset initialLoadComplete
        if (editCoinId && lastLoadedCoinId.current !== editCoinId) {
            setInitialLoadComplete(false);
        }
        // Only load backend data if coinId changes or on first mount for this coin
        if (editCoinId && !initialLoadComplete && lastLoadedCoinId.current !== editCoinId) {
            axios.get(`${BASE_URL}/coin/${editCoinId}`)
                .then((res) => {
                    const c = res.data;
                    console.log("✅ Loaded coin data for editing:", c);
                    // Detect if this is a manually-created coin and switch mode if needed
                    if (c.isManual && !isManualMode) {
                        setIsManualMode(true);
                    }
                    setCoinId(c._id);
                    setTitle(c.title || "");
                    setNumistaNumber(c.numistaNumber || "");
                    setOcreId(c.ocreId || "");
                    setYear(c.year || "");
                    setIssuer(c.issuer || "");
                    setDenomination(c.denomination || "");
                    setGrade(c.grade || "");
                    setGradeDetails(c.gradeDetails || "");
                    setDetails(c.details || "");
                    setProvenance(c.provenance || "");
                    setReference(c.reference || "");
                    setComposition(c.composition || "");
                    setPhysicalDetails(c.physicalDetails || "");
                    if (c.isManual) {
                        splitPhysicalDetails(c.physicalDetails || "");
                    }
                    setMintage(c.mintage || "");
                    setDateAdded(c.dateAdded || dateAdded);
                    setMarksPicture(c.marksPicture || null);
                    setMarks(c.marks || []);
                    setVisualTarget(c.visualTarget || "QR");
                    setVisualMethod(c.visualMethod || "SCRIPT");
                    setSketchId(c.sketchId || "");
                    setLegendObv(c.legendObv || "");
                    setLegendRev(c.legendRev || "");
                    setIsCollectionItem(c.isCollectionItem || false);
                    setCollectionObvImage(c.collectionObvImage || "");
                    setCollectionRevImage(c.collectionRevImage || "");
                    setDetailsWidth(c.detailsWidth || 45);
                    // Saved coins may carry hand-edited references; no live concordance link.
                    setConcordanceSource(null);
                    // Seed the save-diff snapshot with exactly what the setters
                    // normalized to, so the first auto-save after load is a no-op.
                    lastSavedRef.current = {
                        numistaNumber: c.numistaNumber || "",
                        ocreId: c.ocreId || "",
                        year: c.year || "",
                        issuer: c.issuer || "",
                        denomination: c.denomination || "",
                        grade: c.grade || "",
                        gradeDetails: c.gradeDetails || "",
                        details: c.details || "",
                        provenance: c.provenance || "",
                        reference: c.reference || "",
                        composition: c.composition || "",
                        physicalDetails: c.physicalDetails || "",
                        mintage: c.mintage || "",
                        dateAdded: c.dateAdded || dateAdded,
                        marksPicture: c.marksPicture || null,
                        marks: c.marks || [],
                        visualTarget: c.visualTarget || "QR",
                        visualMethod: c.visualMethod || "SCRIPT",
                        sketchId: c.sketchId || "",
                        isManual: !!c.isManual,
                        detailsWidth: c.detailsWidth || 45,
                        legendObv: c.legendObv || "",
                        legendRev: c.legendRev || "",
                        isCollectionItem: c.isCollectionItem || false,
                        collectionObvImage: c.collectionObvImage || "",
                        collectionRevImage: c.collectionRevImage || "",
                    };
                    // Always update Numista details for dropdowns, but don't overwrite fields
                    if (c.numistaDetails) {
                        setNumistaDetails(c.numistaDetails);
                    }
                    console.log("Visual fields loaded - visualTarget:", c.visualTarget, "visualMethod:", c.visualMethod, "sketchId:", c.sketchId);
                    setInitialLoadComplete(true);
                    lastLoadedCoinId.current = editCoinId;
                })
                .catch((err) => {
                    console.error("❌ Error loading coin for edit:", err);
                    if (!coinId) createCoin();
                });
        }
    }, [location, coinId, dateAdded, createCoin, initialLoadComplete, isManualMode]);

    useEffect(() => {
        // In manual mode, create coin immediately if not editing
        if (isManualMode) {
            setTitle("Manual Entry");
            if (draftAvailable) return; // wait for restore/discard decision
            const editCoinId = location?.state?.coinId;
            if (!coinId && !editCoinId) {
                createCoin();
            }
            return;
        }

        if (!numistaDetails.denomination) return;

        // Create a new coin if not editing
        if (draftAvailable) return; // wait for restore/discard decision
        const editCoinId = location?.state?.coinId;
        if (!coinId && !editCoinId) {
            createCoin();
        }
    }, [numistaDetails, coinId, location, dateAdded, createCoin, isManualMode, draftAvailable]);

    useEffect(() => {
        if (coinId && initialLoadComplete) {
            setSaveStatus("saving"); // Immediately show saving on any change
            const delayDebounceFn = setTimeout(() => {
                updateCoinRemote();
            }, 1000);
            return () => clearTimeout(delayDebounceFn);
        }
    }, [year, details, provenance, denomination, grade, gradeDetails, issuer, reference, mintage, composition, physicalDetails, dateAdded, marksPicture, marks, visualTarget, visualMethod, sketchId, legendObv, legendRev, isCollectionItem, collectionObvImage, collectionRevImage, numistaNumber, ocreId, detailsWidth, updateCoinRemote, coinId, initialLoadComplete]);

    // --- Session-expiry draft stash ---
    // If the session dies before the record ever got saved (coinId still null
    // — e.g. the expiry blocked the auto-create, or the user typed into a
    // lookup entry that hadn't been created yet), everything lives only in
    // React state and would be lost by the bounce to the login gate. Stash it
    // to sessionStorage; the "Resume unsaved draft?" modal offers it back on
    // the next visit to this page after re-login.
    const stashDraft = useCallback((payload) => {
        if (!payload || coinIdRef.current) return; // already saved server-side
        if (isEmptyCoinPayload(payload)) return;   // nothing worth keeping
        let json;
        try { json = JSON.stringify(payload); } catch { return; }
        // sessionStorage is ~5MB; drop the heavy base64 payloads if needed —
        // text fields are what matter in a draft.
        if (json.length > 4_000_000) {
            const slim = { ...payload, collectionObvImage: "", collectionRevImage: "", marksPicture: null };
            try { json = JSON.stringify(slim); } catch { return; }
        }
        try { sessionStorage.setItem(DRAFT_KEY, json); } catch { /* quota */ }
    }, []);

    useEffect(() => {
        const handleAuthExpired = () => stashDraft(payloadRef.current);
        window.addEventListener("numistag:auth-expired", handleAuthExpired);
        return () => window.removeEventListener("numistag:auth-expired", handleAuthExpired);
    }, [stashDraft]);

    // Tab close / full navigation with an unsaved (never-created) entry:
    // stash the draft; with an empty created record: best-effort delete so the
    // tab can't litter either.
    useEffect(() => {
        const handlePageHide = () => {
            if (discardedRef.current) return;
            if (coinIdRef.current) {
                if (isEmptyCoinPayload(payloadRef.current)) {
                    discardedRef.current = true;
                    fetch(`${BASE_URL}/coin/delete/${coinIdRef.current}`, {
                        method: "DELETE", credentials: "include", keepalive: true,
                    }).catch(() => {});
                }
            } else {
                stashDraft(payloadRef.current);
            }
        };
        window.addEventListener("pagehide", handlePageHide);
        return () => window.removeEventListener("pagehide", handlePageHide);
    }, [stashDraft]);

    // SPA navigation away with a totally-empty record: delete the stub so it
    // never reaches the collection list. (An in-flight auto-create undoes
    // itself via discardedRef in createCoin's .then.)
    useEffect(() => () => {
        if (saveRetryTimer.current) clearTimeout(saveRetryTimer.current);
        if (discardedRef.current || !coinIdRef.current) return;
        if (isEmptyCoinPayload(payloadRef.current)) {
            discardedRef.current = true;
            axios.delete(`${BASE_URL}/coin/delete/${coinIdRef.current}`).catch(() => {});
        }
    }, []);

    // A draft pending while entering via an existing coin's edit flow would
    // overwrite the loaded coin — drop the stale draft in that case.
    useEffect(() => {
        if (draftAvailable && location?.state?.coinId) {
            sessionStorage.removeItem(DRAFT_KEY);
            setDraftAvailable(false);
        }
    }, [draftAvailable, location]);

    const restoreDraft = () => {
        let d = null;
        try { d = JSON.parse(sessionStorage.getItem(DRAFT_KEY)); } catch { /* corrupt */ }
        sessionStorage.removeItem(DRAFT_KEY);
        setDraftAvailable(false);
        if (!d) return;
        setNumistaNumber(d.numistaNumber || "");
        setOcreId(d.ocreId || "");
        setYear(d.year || "");
        setIssuer(d.issuer || "");
        setDenomination(d.denomination || "");
        setGrade(d.grade || "");
        setGradeDetails(d.gradeDetails || "");
        setDetails(d.details || "");
        setProvenance(d.provenance || "");
        setReference(d.reference || "");
        setComposition(d.composition || "");
        setPhysicalDetails(d.physicalDetails || "");
        setMintage(d.mintage || "");
        setMarksPicture(d.marksPicture ?? null);
        setMarks(Array.isArray(d.marks) ? d.marks : []);
        setLegendObv(d.legendObv || "");
        setLegendRev(d.legendRev || "");
        setIsCollectionItem(!!d.isCollectionItem);
        setCollectionObvImage(d.collectionObvImage || "");
        setCollectionRevImage(d.collectionRevImage || "");
        setVisualTarget(d.visualTarget || "QR");
        setVisualMethod(d.visualMethod || "SCRIPT");
        setSketchId(d.sketchId || "");
        setDetailsWidth(d.detailsWidth || 45);
        setIsManualMode(!!d.isManual);
        if (d.isManual) setTitle("Manual Entry");
        splitPhysicalDetails(d.physicalDetails || "");
        createCoin(d);
        notifications.show({ message: "Draft restored — saving as a new entry.", color: "green" });
    };

    const discardDraft = () => {
        sessionStorage.removeItem(DRAFT_KEY);
        setDraftAvailable(false);
        // Manual mode auto-create was held back while the modal was up.
        if (isManualMode) {
            setTitle("Manual Entry");
            if (!coinId && !location?.state?.coinId) createCoin();
        }
    };

    const handleDiscard = () => {
        if (isCollectionItem) {
            if (window.confirm("This coin is saved to your collection. Delete the label only and keep the collection item?")) {
                discardedRef.current = true;
                axios.put(`${BASE_URL}/coin/detach-label/${coinId}`).then(() => navigate("/"));
            }
        } else {
            if (window.confirm("Are you sure you want to discard this entry?")) {
                discardedRef.current = true;
                axios.delete(`${BASE_URL}/coin/delete/${coinId}`).then(() => navigate("/"));
            }
        }
    };

    const handleDuplicate = () => {
        axios.post(`${BASE_URL}/coin/new`, {
            numistaNumber, ocreId, year, issuer, denomination, grade, gradeDetails,
            details, reference, composition, physicalDetails, mintage, dateAdded, marksPicture, marks,
            visualTarget, visualMethod, sketchId,
            detailsWidth,
            legendObv, legendRev,
            isCollectionItem, collectionObvImage, collectionRevImage
        }).then(() => navigate("/"));
    };

    return (
        <Container size="lg" py="md">
            <AIConfirmModal
                show={showAIConfirm}
                onHide={() => setShowAIConfirm(false)}
                onConfirm={handleGenerateVisual}
                isPremiumAI={isPremiumAI}
            />

            <CreateHeader
                title={title || numistaTitle}
                isManualMode={isManualMode}
                numistaNumber={numistaNumber}
                onDuplicate={handleDuplicate}
                onDiscard={handleDiscard}
                onDone={() => {
                    if (!discardedRef.current && isEmptyCoinPayload(buildPayload())) {
                        discardedRef.current = true;
                        if (coinId) axios.delete(`${BASE_URL}/coin/delete/${coinId}`).catch(() => {});
                    }
                    navigate("/");
                }}
                saveStatus={saveStatus}
            />

            <Modal
                opened={draftAvailable}
                onClose={discardDraft}
                title="Resume unsaved draft?"
                centered
            >
                <Text mb="md">
                    Your session expired before this entry was saved. Restore it, or start fresh?
                </Text>
                <Group justify="flex-end">
                    <Button variant="default" onClick={discardDraft}>Discard</Button>
                    <Button onClick={restoreDraft}>Restore draft</Button>
                </Group>
            </Modal>

            <ManualModeToggle
                isManualMode={isManualMode}
                onChange={(e) => setIsManualMode(e.target.checked)}
            />

            <Group gap={0} align="flex-end" mb="lg" maw={300} wrap="nowrap">
                <TextInput
                    label="Numista Number"
                    leftSection="N#"
                    inputMode="numeric"
                    placeholder="Numista Number"
                    value={numistaNumber}
                    onChange={(e) => {
                        const v = e.target.value;
                        const cleaned = extractLookupValue(v);
                        // Only rewrite when a URL got stripped to digits —
                        // plain typing passes through untouched.
                        setNumistaNumber(cleaned !== v && /^\d+$/.test(cleaned) ? cleaned : v);
                    }}
                    onPaste={(e) => {
                        // Pasting a catalogue link fills just the number —
                        // the URL itself never appears in the field.
                        const pasted = e.clipboardData.getData('text');
                        const val = extractLookupValue(pasted);
                        if (val !== pasted.trim() && /^\d+$/.test(val)) {
                            e.preventDefault();
                            setNumistaNumber(val);
                        }
                    }}
                    style={{ flex: 1 }}
                    styles={!isManualMode && numistaNumber && numistaNumber !== paramNumistaNumber
                        ? { input: { borderTopRightRadius: 0, borderBottomRightRadius: 0 } }
                        : undefined}
                />
                {!isManualMode && numistaNumber && numistaNumber !== paramNumistaNumber && (
                    <Button
                        variant="outline"
                        onClick={() => {
                            if (window.confirm("Changing the Numista number will discard your current work and load a new coin. Continue?")) {
                                navigate(`/create/${numistaNumber}`);
                            }
                        }}
                        style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, marginLeft: -1 }}
                    >
                        Load
                    </Button>
                )}
             </Group>

            {ocreId && (
                <Group mb="lg" maw={300}>
                    <Button
                        component="a"
                        href={CATALOGS[datasetFor(ocreId)].url(ocreId)}
                        target="_blank"
                        rel="noreferrer"
                        variant="light"
                        size="xs"
                    >
                        View on {CATALOGS[datasetFor(ocreId)].label} ↗
                    </Button>
                </Group>
            )}

            <Modal
                opened={!!numistaError}
                onClose={() => {}}
                closeOnClickOutside={false}
                closeOnEscape={false}
                withCloseButton={false}
                centered
                title="Unable to Load Coin"
            >
                <p style={{ marginTop: 0 }}>{numistaError}</p>
                <Group justify="flex-end" mt="md">
                    <Button variant="outline" color="red" onClick={() => navigate("/")}>Go Back</Button>
                    <Button variant="default" onClick={() => {
                        setNumistaError("");
                        setIsManualMode(true);
                        navigate("/create", { replace: true });
                    }}>Switch to Manual Mode</Button>
                </Group>
            </Modal>

            <Modal
                opened={showDiameterWarning}
                onClose={() => setShowDiameterWarning(false)}
                title="Diameter Too Large"
                centered
            >
                <p>The maximum supported coin diameter is <strong>{MAX_DIAMETER}mm</strong>.<br/>
                The value you entered was cleared — please enter a smaller diameter.</p>
                <Button fullWidth mt="md" onClick={() => setShowDiameterWarning(false)}>OK</Button>
            </Modal>

            <Grid gutter="lg">
                <Grid.Col span={{ base: 12, lg: 7 }}>
                    {!isManualMode && (
                        <>
                        <NumistaDataCard
                            numistaDetails={numistaDetails}
                            reference={reference}
                            onVariationChange={(e) => updateFillOutDateAndDetails(
                                numistaDetails.variations[e.target.selectedIndex],
                                numistaDetails.description
                            )}
                            onReferenceChange={setReference}
                        />
                        {/* Mobile-only Reset button */}
                        <Group justify="flex-end" mt="xs" hiddenFrom="lg">
                            <Button
                                variant="subtle"
                                color="gray"
                                size="xs"
                                onClick={async () => {
                                    if (!numistaNumber) return;
                                    try {
                                        const res = await axios.get(`${BASE_URL}/numista/${numistaNumber}`);
                                        updateNumistaDetails(res.data);
                                    } catch (err) {
                                        alert('Failed to fetch Numista data.');
                                    }
                                }}
                                title="Reset all fields to Numista data"
                                disabled={!numistaNumber}
                                leftSection={
                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 1 0-.908-.418A6 6 0 1 0 8 2v1z" />
                                        <path d="M8 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 0-1H8.5V1.5A.5.5 0 0 0 8 1z" />
                                    </svg>
                                }
                            >
                                Reset fields from Numista
                            </Button>
</Group>

                        </>
                    )}

                    <LabelSpecificsCard
                        grade={grade}
                        onGradeChange={(e) => setGrade(e.target.value)}
                        isManualMode={isManualMode}
                        mass={mass}
                        onMassChange={handleMassChange}
                        diameter={diameter}
                        onDiameterChange={handleDiameterChange}
                        orientation={orientation}
                        onOrientationChange={handleOrientationChange}
                     />

                    {isManualMode && (
                        <PasteNumistaAccordion
                            pasteText={pasteText}
                            setPasteText={setPasteText}
                            onParse={handleParseText}
                        />
                    )}

                    <VisualCustomizationCard
                        isManualMode={isManualMode}
                        pastedImage={pastedImage}
                        visualTarget={visualTarget}
                        visualMethod={visualMethod}
                        numistaSide={numistaSide}
                        isGenerating={isGenerating}
                        isGeneratingQR={isGeneratingQR}
                        onVisualTargetChange={(value) => {
                            setVisualTarget(value);
                            setUserChangedVisualTarget(true);
                        }}
                        onVisualMethodChange={(value) => setVisualMethod(value)}
                        onNumistaSideChange={(value) => setNumistaSide(value)}
                        onGenerateVisual={handleGenerateVisual}
                        sketchId={sketchId}
                        onSketchSelect={(id) => setSketchId(id)}
                        numistaNumber={numistaNumber}
                        obverseImageUrl={numistaDetails.obverseImage}
                        reverseImageUrl={numistaDetails.reverseImage}
                        onImageFile={handleImageFile}
                        hasMultipleDates={(numistaDetails.variations?.length ?? 0) > 1}
                        swapDate={swapDate}
                        onSwapDateChange={(e) => setSwapDate(e.target.checked)}
                        isPremiumAI={isPremiumAI}
                        onPremiumAIChange={(e) => setIsPremiumAI(e.target.checked)}
                        legendObv={legendObv}
                        onLegendObvChange={(e) => setLegendObv(e.target.value)}
                        legendRev={legendRev}
                        onLegendRevChange={(e) => setLegendRev(e.target.value)}
                    />

                    <ProvenanceCard
                        provenance={provenance}
                        onProvenanceChange={(e) => setProvenance(e.target.value)}
                    />

                    <CollectionSettingsCard
                        isCollectionItem={isCollectionItem}
                        onToggleCollection={(e) => setIsCollectionItem(e.target.checked)}
                        collectionObvImage={collectionObvImage}
                        onObvImageUpload={setCollectionObvImage}
                        onObvImageClear={() => setCollectionObvImage("")}
                        collectionRevImage={collectionRevImage}
                        onRevImageUpload={setCollectionRevImage}
                        onRevImageClear={() => setCollectionRevImage("")}
                    />
                </Grid.Col>

                <Grid.Col span={{ base: 12, lg: 5 }}>
                    <PreviewCard
                        year={year} setYear={setYear}
                        issuer={issuer} setIssuer={setIssuer}
                        denomination={denomination} setDenomination={setDenomination}
                        grade={grade} setGrade={setGrade}
                        gradeDetails={gradeDetails} setGradeDetails={setGradeDetails}
                        mintage={mintage} setMintage={setMintage}
                        reference={reference} setReference={setReference}
                        marksPicture={marksPicture}
                        marks={marks}
                        details={details} setDetails={setDetails}
                        detailsWidth={detailsWidth} setDetailsWidth={setDetailsWidth}
                        composition={composition} setComposition={setComposition}
                        physicalDetails={physicalDetails} setPhysicalDetails={setPhysicalDetails}
                        numistaNumber={numistaNumber}
                        ocreId={ocreId}
                        dateAdded={dateAdded} setDateAdded={setDateAdded}
                        visualTarget={visualTarget}
                        sketchId={sketchId}
                        isGenerating={isGenerating}
                        isManualMode={isManualMode}
                        updateNumistaDetails={updateNumistaDetails}
                        BASE_URL={BASE_URL}
                        saveStatus={saveStatus}
                        legendObv={legendObv} setLegendObv={setLegendObv}
                        legendRev={legendRev} setLegendRev={setLegendRev}
                        concordanceSource={concordanceSource}
                        provenance={provenance}
                    />
                </Grid.Col>
            </Grid>
        </Container>
    );
};

export default Create;
