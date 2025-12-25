import React from 'react';

/**
 * دوال تنسيق محلية لتجنب مشاكل الاستيراد
 */
const localFormatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return "-";
  return num.toLocaleString("en-US");
};

const localFormatCurrency = (num: number | null | undefined, includeDecimals: boolean = true): string => {
  if (num === null || num === undefined) return "-";
  
  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  };
  
  return `${num.toLocaleString("en-US", options)} ريال`;
};

const localFormatPercentage = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return "-";
  return `${num.toLocaleString("en-US")}%`;
};

const localFormatArea = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return "-";
  return `${num.toLocaleString("en-US")} م²`;
};

const localFormatPricePerUnit = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return "-";
  return `${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ريال/م²`;
};

const localFormatPercentageWithDecimal = (num: number | null | undefined, decimalPlaces: number = 1): string => {
  if (num === null || num === undefined) return "-";
  return `${num.toLocaleString("en-US", { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces })}%`;
};

/**
 * مكون wrapper لتنسيق الأرقام مع اتجاه LTR داخل RTL
 */
const FormatWrapper: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <span 
      dir="ltr" 
      style={{ display: 'inline-flex', direction: 'ltr' }}
      className={className}
    >
      {children}
    </span>
  );
};

/**
 * مكون لعرض المبالغ المالية
 */
export const Amount: React.FC<{
  value: number | null | undefined;
  includeDecimals?: boolean;
  className?: string;
}> = ({ value, includeDecimals = true, className = '' }) => {
  if (value === null || value === undefined) {
    return <span className={className}>-</span>;
  }

  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  };

  return (
    <FormatWrapper className={className}>
      {value.toLocaleString("en-US", options)} <span style={{ marginRight: '2px' }}>ريال</span>
    </FormatWrapper>
  );
};

/**
 * مكون لعرض النسب المئوية
 */
export const Percentage: React.FC<{
  value: number | null | undefined;
  decimalPlaces?: number;
  className?: string;
}> = ({ value, decimalPlaces = 0, className = '' }) => {
  if (value === null || value === undefined) {
    return <span className={className}>-</span>;
  }

  const formattedValue = decimalPlaces > 0
    ? value.toLocaleString("en-US", { 
        minimumFractionDigits: decimalPlaces, 
        maximumFractionDigits: decimalPlaces 
      })
    : value.toLocaleString("en-US");

  return (
    <FormatWrapper className={className}>
      {formattedValue}<span style={{ marginRight: '2px' }}>%</span>
    </FormatWrapper>
  );
};

/**
 * مكون لعرض المساحات
 */
export const Area: React.FC<{
  value: number | null | undefined;
  className?: string;
}> = ({ value, className = '' }) => {
  if (value === null || value === undefined) {
    return <span className={className}>-</span>;
  }

  return (
    <FormatWrapper className={className}>
      {value.toLocaleString("en-US")} <span style={{ marginRight: '2px' }}>م²</span>
    </FormatWrapper>
  );
};

/**
 * مكون لعرض سعر الوحدة
 */
export const PricePerUnit: React.FC<{
  value: number | null | undefined;
  className?: string;
}> = ({ value, className = '' }) => {
  if (value === null || value === undefined) {
    return <span className={className}>-</span>;
  }

  return (
    <FormatWrapper className={className}>
      {value.toLocaleString("en-US", { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })} <span style={{ marginRight: '2px' }}>ريال/م²</span>
    </FormatWrapper>
  );
};

/**
 * مكون لعرض الأرقام العادية (بدون رموز)
 */
export const Number: React.FC<{
  value: number | null | undefined;
  className?: string;
}> = ({ value, className = '' }) => {
  if (value === null || value === undefined) {
    return <span className={className}>-</span>;
  }

  return (
    <span dir="ltr" className={className}>
      {value.toLocaleString("en-US")}
    </span>
  );
};

/**
 * مكون حقل إدخال للأرقام الإنجليزية فقط
 */
export const NumericInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputMode?: 'numeric' | 'decimal';
}> = ({ value, onChange, placeholder = '', className = '', inputMode = 'decimal' }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // السماح فقط بالأرقام الإنجليزية والنقطة والفواصل
    const newValue = e.target.value.replace(/[^0-9.,-]/g, '');
    onChange(newValue);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // تنظيف القيمة - استبدال الفواصل بالنقاط للنقاط العشرية
    let cleaned = e.target.value.replace(/,/g, '.');
    
    // إذا كان هناك أكثر من نقطة، احتفظ بالأولى فقط
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    
    onChange(cleaned);
  };

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      inputMode={inputMode}
      pattern="[0-9.,-]*"
      dir="ltr"
      className={className}
      style={{ textAlign: 'left', direction: 'ltr' }}
    />
  );
};

/**
 * مكون لعرض القيمة باستخدام دوال التنسيق (للنصوص العادية)
 */
export const FormattedText: React.FC<{
  type: 'currency' | 'percentage' | 'area' | 'pricePerUnit' | 'number';
  value: number | null | undefined;
  includeDecimals?: boolean;
  decimalPlaces?: number;
  className?: string;
}> = ({ type, value, includeDecimals = true, decimalPlaces = 1, className = '' }) => {
  if (value === null || value === undefined) {
    return <span className={className}>-</span>;
  }

  let text = '';
  switch (type) {
    case 'currency':
      text = localFormatCurrency(value, includeDecimals);
      break;
    case 'percentage':
      text = decimalPlaces > 0 
        ? localFormatPercentageWithDecimal(value, decimalPlaces)
        : localFormatPercentage(value);
      break;
    case 'area':
      text = localFormatArea(value);
      break;
    case 'pricePerUnit':
      text = localFormatPricePerUnit(value);
      break;
    case 'number':
      text = localFormatNumber(value);
      break;
  }

  return <FormatWrapper className={className}>{text}</FormatWrapper>;
};

/**
 * مكون لتحويل الأرقام في النصوص
 */
export const DigitNormalizer: React.FC<{
  children: string;
}> = ({ children }) => {
  const normalizeDigits = (value: string): string => {
    if (!value) return value;
    
    // تحويل الأرقام العربية (٠١٢٣٤٥٦٧٨٩) إلى إنجليزية
    const arabicToEnglish = value.replace(/[٠-٩]/g, (d) => 
      String.fromCharCode(d.charCodeAt(0) - 1632)
    );
    
    // تحويل الأرقام الهندية (٠١٢٣٤٥٦٧٨٩) إلى إنجليزية
    const persianToEnglish = arabicToEnglish.replace(/[۰-۹]/g, (d) => 
      String.fromCharCode(d.charCodeAt(0) - 1776)
    );
    
    return persianToEnglish;
  };

  return <>{normalizeDigits(children)}</>;
};
