import { Link } from 'react-router-dom';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  credentials: string[];
  primaryCta: {
    text: string;
    href: string;
    external?: boolean;
    onClick?: () => void;
  };
  secondaryCta?: {
    text: string;
    href: string;
  };
  note?: string;
}

const HeroSection = ({
  title,
  subtitle,
  description,
  imageSrc,
  imageAlt,
  credentials,
  primaryCta,
  secondaryCta,
  note,
}: HeroSectionProps) => {
  return (
    <section
      className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-blue-50/30 to-white relative overflow-hidden"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239CA3AF' fill-opacity='0.03'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
      }}
      aria-label="Homepage hero"
    >
      {/* Abstract background shapes */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-40 left-0 w-80 h-80 bg-purple-100/10 rounded-full blur-3xl -z-10"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Image hfeufeulfjifwehfwefewuo;test*/}
          <div className="order-2 lg:order-1">
            <div className="relative">
              <img
                src={imageSrc}
                alt={imageAlt}
                className="w-full h-auto rounded-lg shadow-2xl max-w-md mx-auto lg:mx-0"
                loading="eager"
                decoding="async"
                width="400"
                height="300"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/10 rounded-lg"></div>
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2 text-center lg:text-left max-w-2xl mx-auto lg:mx-0 px-4 sm:px-0">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
              {title}
            </h1>

            <h2 className="text-xl text-blue-600 font-semibold mb-6">
              {subtitle}
            </h2>

            <div
              className="text-gray-600 leading-relaxed mb-8"
              dangerouslySetInnerHTML={{ __html: description }}
            />

            {/* Credentials */}
            <ul
              className="space-y-4 sm:space-y-5 mb-8 sm:mb-10 max-w-lg"
              aria-label="Credentials and approach"
            >
              {credentials.map((credential, index) => (
                <li
                  key={index}
                  className="flex items-start justify-center lg:justify-start group"
                >
                  <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-emerald-100 rounded-full flex items-center justify-center mr-4 sm:mr-5 mt-0.5 group-hover:bg-emerald-200 transition-colors duration-200">
                    <span
                      className="text-emerald-600 text-sm sm:text-base font-bold"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                  </div>
                  <span className="text-slate-800 leading-relaxed text-left text-sm sm:text-base">
                    {credential}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                {primaryCta.external ? (
                  <a
                    href={primaryCta.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={primaryCta.onClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label={primaryCta.text}
                  >
                    <span className="mr-2 text-sm sm:text-base">📅</span>
                    <span className="hidden sm:inline">{primaryCta.text}</span>
                    <span className="sm:hidden">Book Now</span>
                  </a>
                ) : (
                  <Link
                    to={primaryCta.href}
                    onClick={primaryCta.onClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <span className="mr-2 text-sm sm:text-base">📅</span>
                    <span className="hidden sm:inline">{primaryCta.text}</span>
                    <span className="sm:hidden">Book Now</span>
                  </Link>
                )}
              </div>

              {secondaryCta && (
                <Link
                  to={secondaryCta.href}
                  className="inline-flex items-center justify-center px-6 py-3 bg-white hover:bg-gray-50 text-blue-600 font-semibold rounded-lg border-2 border-blue-200 hover:border-blue-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <span className="mr-2 text-sm">ℹ️</span>
                  <span>{secondaryCta.text}</span>
                </Link>
              )}
            </div>

            {note && (
              <div className="flex justify-center lg:justify-start w-full max-w-xl">
                <div className="availability-notice max-w-xs sm:max-w-sm text-center mx-auto lg:mx-0">
                  <p className="availability-message">{note}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
