interface LogoProps {
  size?: 'sm' | 'lg';
}

export default function Logo({ size = 'sm' }: LogoProps) {
  if (size === 'lg') {
    return (
      <div className="flex flex-col items-center gap-2">
        <img
          src="/showpno.png.png"
          alt="স্বপ্ন ক্লিনিক এন্ড ডায়াগনস্টিক সেন্টার"
          className="h-20 w-auto object-contain"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/showpno.png.png"
        alt="স্বপ্ন ক্লিনিক"
        className="h-10 w-auto object-contain"
      />
    </div>
  );
}
