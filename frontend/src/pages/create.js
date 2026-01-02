import {useParams, useNavigate, useLocation} from "react-router-dom";
import { useState, useEffect } from "react";
import {QRCode} from "react-qr-code";
import axios from "axios";

import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { FrontLabelContainer, BackLabelContainer } from "./label";

const BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

/**
 * Create Page Component
 * Fetches Numista coin details and allows creating/editing a coin entry.
 * @param {object} props - Component props.
 * @returns {JSX.Element} The Create page component.
 */
const Create = () => {
    const {numistaNumber} = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [numistaDetails, setNumistaDetails] = useState({});
    const [coinId, setCoinId] = useState(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const [year, setYear] = useState("");
    const [details, setDetails] = useState("");
    const [denomination, setDenomination] = useState("");
    const [grade, setGrade] = useState("");
    const [gradeDetails, setGradeDetails] = useState("");   
    const [issuer, setIssuer] = useState("");
    const [reference, setReference] = useState("");
    const [mintage, setMintage] = useState("");
    const [composition, setComposition] = useState("");
    const [physicalDetails, setPhysicalDetails] = useState("");
    const [dateAdded, setDateAdded] = useState("");
    const [marksPicture, setMarksPicture] = useState(null);
    const [title, setTitle] = useState("");

    var updateNumistaDetails = (jsonData) => {
        const editCoinId = location && location.state && location.state.coinId ? location.state.coinId : null;
        if (editCoinId) {
            setNumistaDetails(jsonData);
            return;
        }

        setNumistaDetails(jsonData);
        setDenomination(jsonData.denomination);
        setIssuer(jsonData.issuer);
        setComposition(jsonData.composition);
        setTitle(jsonData.title);

        setPhysicalDetails(jsonData.orientation + "\n" + jsonData.diameter + "\n" + jsonData.mass);
        
        if (jsonData.variations && jsonData.variations.length > 0) {
            updateFillOutDateAndDetails(jsonData.variations[0], jsonData.description);
        }

        if (jsonData.references && jsonData.references.length > 0) {
            setReference(jsonData.references[0]);
        }
    }

    var updateFillOutDateAndDetails = (variation, description) => {
        setYear(variation.date);

        if (variation.mintage.length > 0) {
            setMintage("m. " + variation.mintage);
        } else {
            setMintage("");
        }

        if (variation.marks_picture) {
            setMarksPicture(variation.marks_picture);
        } else {
            setMarksPicture(null);
        }
        
        var comments = variation.comment;

        if(comments.includes("Proof")) {
            setGrade("Proof")
            comments = comments.replace("Proof", "");
        }

        if (comments.length > 0) {
            setDetails(comments + "\n" + description);
        } else {
            setDetails(description);
        }
    }

    useEffect(() => {
        const currentDate = new Date();
        const formattedDate = `${currentDate.getFullYear()}-${currentDate.toLocaleString('default', { month: 'short' }).toUpperCase()}-${String(currentDate.getDate()).padStart(2, '0')}`;
        setDateAdded(formattedDate);
        getNumistaDetails();
      }, []);

    useEffect(() => {
        if (!numistaDetails.denomination) return;

        // const editCoinId = location && location.state && location.state.coinId ? location.state.coinId : null;
        const editCoinId = location?.state?.coinId;

        if (editCoinId && !coinId) {
            axios.get(`${BASE_URL}/coin/${editCoinId}`)
                .then((res) => {
                        const c = res.data;
                        setCoinId(c._id);
                        setYear(c.year || "");
                        setIssuer(c.issuer || "");
                        setDenomination(c.denomination || "");
                        setGrade(c.grade || "");
                        setGradeDetails(c.gradeDetails || "");
                        setDetails(c.details || "");
                        setReference(c.reference || "");
                        setComposition(c.composition || "");
                        setPhysicalDetails(c.physicalDetails || "");
                        setMintage(c.mintage || "");
                        setDateAdded(c.dateAdded || dateAdded);
                        setMarksPicture(c.marksPicture || null); // Load marksPicture from DB
                        setInitialLoadComplete(true);
                    })
                .catch((err) => {
                    console.error("Error loading coin for edit:", err);
                    if (!coinId) createCoin();
                });
            return;
        }

        if (!coinId) {
            createCoin();
        }
    }, [numistaDetails]);

    useEffect(() => {
        if (coinId && initialLoadComplete) {
            updateCoinRemote();
        }
    }, [year, details, denomination, grade, gradeDetails, issuer, reference, mintage, composition, physicalDetails, dateAdded, marksPicture, coinId, initialLoadComplete]);

    const getNumistaDetails = () => {
        axios
          .get(`${BASE_URL}/numista/${numistaNumber}`)
          .then((res) => updateNumistaDetails(res.data))
          .catch((err) => console.error(err));
      };

    const createCoin = () => {
        axios
          .post(`${BASE_URL}/coin/new`, {
            numistaNumber,
            year,
            issuer,
            denomination,
            grade,
            gradeDetails,
            details,
            reference,
            composition,
            physicalDetails,
            mintage,
            dateAdded,
            marksPicture, // Save to DB
          })
          .then((res) => {
            setCoinId(res.data._id);
            setInitialLoadComplete(true);
          })
          .catch((err) => console.error("Error creating coin:", err));
    };

    const updateCoinRemote = () => {
        axios
          .put(`${BASE_URL}/coin/update/${coinId}`, {
            numistaNumber,
            year,
            issuer,
            denomination,
            grade,
            gradeDetails,
            details,
            reference,
            composition,
            physicalDetails,
            mintage,
            dateAdded,
            marksPicture, // Update in DB
          })
          .then((res) => {
            console.log("Coin updated:", res.data);
          })
          .catch((err) => console.error("Error updating coin:", err));
    };

    const handleDiscard = () => {
        if (!coinId) return;
        axios
          .delete(`${BASE_URL}/coin/delete/${coinId}`)
          .then((res) => {
            navigate("/");
          })
          .catch((err) => console.error("Error discarding coin:", err));
    };

    const handleDuplicate = () => {
        axios
          .post(`${BASE_URL}/coin/new`, {
            numistaNumber,
            year,
            issuer,
            denomination,
            grade,
            gradeDetails,
            details,
            reference,
            composition,
            physicalDetails,
            mintage,
            dateAdded,
            marksPicture, // Duplicate includes image
          })
          .then((res) => {
            navigate("/");
          })
          .catch((err) => console.error("Error duplicating coin:", err));
    };

    const handleDone = () => {
        navigate("/");
    };

    return (
        <div>
            <h1>Create</h1>
            <h2>{title}</h2>
            <div>
                <Button variant="outline-danger" onClick={handleDiscard} style={{ marginBottom: '20px', marginRight: '10px' }}>
                    Discard
                </Button>
                <Button variant="outline-primary" onClick={handleDuplicate} style={{ marginBottom: '20px', marginRight: '10px' }}>
                    Duplicate
                </Button>
                <Button variant="outline-success" onClick={handleDone} style={{ marginBottom: '20px' }}>
                    Done
                </Button>
            </div>
            <div className="numista-details">
                <Form.Select
                    plaintext
                    onChange={(e) => {
                        const selectedIndex = e.target.selectedIndex;
                        updateFillOutDateAndDetails(numistaDetails.variations[selectedIndex], numistaDetails.description);
                    }}>
                    {
                        (numistaDetails && numistaDetails.variations && numistaDetails.variations.length > 0) ? (
                            numistaDetails.variations.map((variation, index) => (
                                <option key={index} value={variation.date}>
                                    {variation.date} {variation.comment && `(${variation.comment})`}
                                </option>
                            ))
                        ) : (
                            <option value="0">No Variations</option>
                        )
                    }
                </Form.Select>
                <Form.Select
                    plaintext
                    onChange={(e) => {
                        setReference(e.target.value);
                    }}>
                    {
                        (numistaDetails && numistaDetails.references && numistaDetails.references.length > 0) ? (
                            numistaDetails.references.map((ref, index) => (
                                <option key={index} value={ref}>
                                    {ref}
                                </option>
                            ))
                        ) : (
                            <option value="0">No References</option>
                        )
                    }
                </Form.Select>
                <Form.Select
                    aria-label="Select Sheldon Grade"
                    plaintext
                    onChange={(e) => {
                        setGrade(e.target.value);
                    }}
                >
                    <option value="">Select Sheldon Grade</option>
                    <option value="MS-70">MS-70</option>
                    <option value="MS-69">MS-69</option>
                    <option value="MS-68">MS-68</option>
                    <option value="MS-67">MS-67</option>
                    <option value="MS-66">MS-66</option>
                    <option value="MS-65">MS-65</option>
                    <option value="MS-64">MS-64</option>
                    <option value="MS-63">MS-63</option>
                    <option value="MS-62">MS-62</option>
                    <option value="MS-61">MS-61</option>
                    <option value="MS-60">MS-60</option>
                    <option value="BU">BU (Brilliant Uncirculated)</option>
                    <option value="UNC">UNC (Uncirculated)</option>
                    <option value="AU">AU (About Uncirculated)</option>
                    <option value="AU-55">AU-55</option>
                    <option value="AU-50">AU-50</option>
                    <option value="EF+">EF+ (Extremely Fine Plus)</option>
                    <option value="EF">EF (Extremely Fine)</option>
                    <option value="EF-45">EF-45</option>
                    <option value="EF-40">EF-40</option>
                    <option value="VF+">VF+ (Very Fine Plus)</option>
                    <option value="VF">VF (Very Fine)</option>
                    <option value="VF-30">VF-30</option>
                    <option value="VF-20">VF-20</option>
                    <option value="F+">F+ (Fine Plus)</option>
                    <option value="F">F (Fine)</option>
                    <option value="F-15">F-15 (Fine 15)</option>
                    <option value="F-12">F-12 (Fine 12)</option>
                    <option value="VG+">VG+ (Very Good Plus)</option>
                    <option value="VG">VG (Very Good)</option>
                    <option value="VG-10">VG-10 (Very Good 10)</option>
                    <option value="VG-8">VG-8 (Very Good 8)</option>
                    <option value="G+">G+ (Good Plus)</option>
                    <option value="G">G (Good)</option>
                    <option value="G-6">G-6 (Good 6)</option>
                    <option value="G-4">G-4 (Good 4)</option>
                    <option value="AG+">AG+ (About Good Plus)</option>
                    <option value="AG">AG (About Good)</option>
                    <option value="AG-3">AG-3 (About Good 3)</option>
                    <option value="Proof">Proof</option>
                    <option value="Spec">Specimen</option>
                </Form.Select>
            </div>

            <FrontLabelContainer                
                isEditable={false}
                year={year}
                issuer={issuer}
                denomination={denomination}
                grade={grade}
                gradeDetails={gradeDetails}
                mintage={mintage}
                reference={reference}
                details={details}
                marksPicture={marksPicture}
            />

            <BackLabelContainer
                isEditable={false}
                composition={composition}
                physicalDetails={physicalDetails}
                numistaNumber={numistaNumber}
                dateAdded={dateAdded}
            />

            <p />

            <FrontLabelContainer
                isEditable={true}
                year={year}
                setYear={setYear}
                issuer={issuer}
                setIssuer={setIssuer}
                denomination={denomination}
                setDenomination={setDenomination}
                grade={grade}
                setGrade={setGrade}
                gradeDetails={gradeDetails}
                setGradeDetails={setGradeDetails}
                mintage={mintage}
                setMintage={setMintage}
                reference={reference}
                setReference={setReference}
                marksPicture={marksPicture}
                details={details}
                setDetails={setDetails}
            />
            <p />
            <BackLabelContainer
                isEditable={true}
                composition={composition}
                setComposition={setComposition}
                physicalDetails={physicalDetails}
                setPhysicalDetails={setPhysicalDetails}
                numistaNumber={numistaNumber}
                dateAdded={dateAdded}
                setDateAdded={setDateAdded}
            />
        </div>
    );
}
  
export default Create;