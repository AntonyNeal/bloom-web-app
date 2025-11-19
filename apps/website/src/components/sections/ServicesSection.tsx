import { Link } from 'react-router-dom';

interface Service {
  title: string;
  description: string;
  href: string;
  icon?: string;
  price?: string;
}

interface ServicesSectionProps {
  title: string;
  services: Service[];
}

const ServicesSection = ({ title, services }: ServicesSectionProps) => {
  return (
    <section
      className="py-16 lg:py-24 bg-white relative overflow-hidden"
      aria-label="Our services"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-200 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-indigo-200 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-200 rounded-full blur-2xl"></div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            {title}
          </h2>
          <p className="text-xl text-slate-800 max-w-2xl mx-auto mb-6">
            Professional psychological services tailored to your needs
          </p>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            <Link
              to="/greater-hunter"
              className="text-blue-600 hover:text-blue-700 underline font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 px-1 rounded transition-colors"
            >
              Learn more about our psychology services in Newcastle and the
              Greater Hunter.
            </Link>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {services.map((service, index) => (
            <Link
              key={index}
              to={service.href}
              className="bg-blue-100/70 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-blue-200/60 transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 p-6 block group"
            >
              {service.icon && (
                <div className="flex justify-center mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white/80 backdrop-blur-sm rounded-lg border border-blue-200/60 shadow-sm group-hover:bg-white/90 transition-colors duration-200">
                    <span className="text-4xl">{service.icon}</span>
                  </div>
                </div>
              )}
              <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center group-hover:text-blue-700 transition-colors duration-200">
                {service.title}
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed text-center group-hover:text-gray-800 transition-colors duration-200">
                {service.description}
              </p>
              {service.price && (
                <div className="mt-3 text-center">
                  <span className="inline-block bg-blue-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
                    {service.price}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
