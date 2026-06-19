import { type CSSProperties } from 'react';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  avatarColor?: string;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
}

/** Hiển thị ảnh avatar nếu có, fallback về initials với màu nền */
export default function UserAvatar({
  name,
  avatarUrl,
  size = 36,
  avatarColor = '#1d6ced',
  style,
  className,
  onClick,
}: UserAvatarProps) {
  const initials = name
    .split(' ')
    .slice(-2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

  const base: CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    cursor: onClick ? 'pointer' : 'default',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: size * 0.38,
    fontWeight: 700,
    fontFamily: "'Montserrat', sans-serif",
    ...style,
  };

  if (avatarUrl) {
    return (
      <div style={base} className={className} onClick={onClick}>
        <img
          src={avatarUrl}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            // Nếu ảnh load lỗi, ẩn img và hiển thị div initials
            (e.currentTarget.parentElement as HTMLDivElement).style.backgroundColor = avatarColor;
            (e.currentTarget.parentElement as HTMLDivElement).innerHTML = `<span style="color:white;font-weight:700;font-family:'Montserrat',sans-serif">${initials}</span>`;
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{ ...base, backgroundColor: avatarColor, color: 'white' }}
      className={className}
      onClick={onClick}
    >
      {initials}
    </div>
  );
}
