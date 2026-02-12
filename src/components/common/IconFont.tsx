import React from 'react';

interface IconFontProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  size?: number | string;
  color?: string;
}

// 这里的 scriptUrl 需要用户提供或者配置
// 例如: '//at.alicdn.com/t/font_xxxx.js'
const scriptUrl = ''; 

if (scriptUrl && typeof document !== 'undefined') {
  const script = document.createElement('script');
  script.src = scriptUrl;
  document.body.appendChild(script);
}

/**
 * IconFont 组件
 * 用于加载 iconfont.cn 的图标
 */
export const IconFont: React.FC<IconFontProps> = ({ name, size = 16, color, style, ...props }) => {
  if (!scriptUrl) {
    console.warn('IconFont scriptUrl is not configured');
    return null;
  }

  const styles = {
    fontSize: size,
    color: color,
    ...style,
  };

  return (
    <span role="img" {...props} style={styles} className={`iconfont ${props.className || ''}`}>
      <svg className="icon" aria-hidden="true" style={{ width: '1em', height: '1em', fill: 'currentColor', verticalAlign: '-0.15em' }}>
        <use xlinkHref={`#${name}`}></use>
      </svg>
    </span>
  );
};
