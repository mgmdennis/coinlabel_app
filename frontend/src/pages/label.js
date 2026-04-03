import { QRCode } from "react-qr-code";
import { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LabelField from '../components/LabelField';
import labelThemes from '../themes';

// Define API Base URL for fetching images
const BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

// THEME SWITCHERS
export function FrontLabel(props) {
    const theme = props.labelTheme || "The Shelton";
    const { FrontLabel: ThemeFront } = labelThemes[theme] || labelThemes["The Shelton"];
    return <ThemeFront {...props} />;
}

export function BackLabel(props) {
    const theme = props.labelTheme || "The Shelton";
    const { BackLabel: ThemeBack } = labelThemes[theme] || labelThemes["The Shelton"];
    return <ThemeBack {...props} />;
}