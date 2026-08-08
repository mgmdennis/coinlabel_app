import { NativeSelect } from '@mantine/core';

export const GradeSelect = ({ value, onChange, label = "Sheldon Grade", ...props }) => {
    return (
        <NativeSelect label={label} value={value} onChange={onChange} {...props}>
            <option value="">Select Sheldon Grade</option>
            <optgroup label="Mint State (Uncirculated)">
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
            </optgroup>
            <optgroup label="About Uncirculated">
                <option value="AU">AU (About Uncirculated)</option>
                <option value="AU-58">AU-58</option>
                <option value="AU-55">AU-55</option>
                <option value="AU-50">AU-50</option>
            </optgroup>
            <optgroup label="Extremely Fine">
                <option value="EF+">EF+ (Extremely Fine Plus)</option>
                <option value="EF">EF (Extremely Fine)</option>
                <option value="EF-45">EF-45</option>
                <option value="EF-40">EF-40</option>
            </optgroup>
            <optgroup label="Very Fine">
                <option value="VF+">VF+ (Very Fine Plus)</option>
                <option value="VF">VF (Very Fine)</option>
                <option value="VF-30">VF-30</option>
                <option value="VF-20">VF-20</option>
            </optgroup>
            <optgroup label="Fine">
                <option value="F+">F+ (Fine Plus)</option>
                <option value="F">F (Fine)</option>
                <option value="F-15">F-15</option>
                <option value="F-12">F-12</option>
            </optgroup>
            <optgroup label="Very Good / Good">
                <option value="VG+">VG+ (Very Good Plus)</option>
                <option value="VG">VG (Very Good)</option>
                <option value="VG-10">VG-10</option>
                <option value="VG-8">VG-8</option>
                <option value="G+">G+ (Good Plus)</option>
                <option value="G">G (Good)</option>
                <option value="G-6">G-6</option>
                <option value="G-4">G-4</option>
            </optgroup>
            <optgroup label="About Good / Basal">
                <option value="AG+">AG+ (About Good Plus)</option>
                <option value="AG">AG (About Good)</option>
                <option value="AG-3">AG-3</option>
            </optgroup>
            <optgroup label="Special Strikings">
                <option value="Proof">Proof</option>
                <option value="Spec">Specimen</option>
            </optgroup>
        </NativeSelect>
    );
};
