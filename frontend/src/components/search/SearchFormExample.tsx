// Example of using the ComboboxComponent in SearchForm
import ComboboxComponent from '../shared/ComboboxComponent';

// For the Language selection section in SearchForm:
const languageOptions = LANGUAGES.map(lang => ({
  id: lang.code,
  label: lang.name
}));

// Then in your JSX:
<div>
  <ComboboxComponent
    label="Language"
    items={languageOptions}
    value={searchOptions.language}
    onChange={(value) => handleOptionChange('language', value)}
    placeholder="Any language"
    className="mt-1"
  />
</div>
