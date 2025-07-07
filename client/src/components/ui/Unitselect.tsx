import React from 'react';
import { Select } from 'antd';

const { Option } = Select;

interface UnitSelectProps {
  value?: string;
  baseUnit?: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

const UnitSelect: React.FC<UnitSelectProps> = ({ value, baseUnit, onChange, disabled }) => {
  const uom = (baseUnit || '').toString().toLowerCase().trim();

  let options: React.ReactNode = null;
  if (['ton', 'tons', 'tonne', 'tonnes'].includes(uom)) {
    options = (
      <>
        <Option value="ton">ton</Option>
        <Option value="kg">kg</Option>
        <Option value="g">g</Option>
      </>
    );
  } else if (uom === 'kg') {
    options = (
      <>
        <Option value="kg">kg</Option>
        <Option value="g">g</Option>
      </>
    );
  } else if (uom === 'litre' || uom === 'liter') {
    options = (
      <>
        <Option value="litre">litre</Option>
        <Option value="ml">ml</Option>
      </>
    );
  } else if (uom === 'piece' || uom === 'pieces') {
    options = <Option value="piece">piece</Option>;
  } else if (uom) {
    options = <Option value={uom}>{baseUnit}</Option>;
  } else {
    options = <Option disabled>No units</Option>;
  }

  return (
    <Select
      value={value || baseUnit}
      onChange={onChange}
      style={{ flex: 1 }}
      className="rounded"
      disabled={disabled}
    >
      {options}
    </Select>
  );
};

export default UnitSelect;