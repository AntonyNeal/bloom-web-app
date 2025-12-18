import { BookingButton } from '../BookingButton';

interface AboutColumn {
  title: string;
  items: string[];
}

interface Practitioner {
  name: string;
  description: string;
  aboutHref: string;
  location: {
    text: string;
    href: string;
  };
  cta: {
    text: string;
    href: string;
    external?: boolean;
  };
}

interface AboutSectionProps {
  columns: AboutColumn[];
  practitioner: Practitioner;
}

const AboutSection = ({ columns, practitioner }: AboutSectionProps) => {
  return (
    <section
      className="py-12 lg:py-16 bg-gray-50/50"
      aria-label="About our practice"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Who I Help Section */}
        <div className="max-w-4xl mx-auto mb-12 lg:mb-16">
          <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100/50 p-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-8 text-center">
              Who I Help
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {columns.map((column, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100/50 p-6"
                >
                  <h3 className="text-blue-600 font-semibold uppercase text-sm tracking-wide mb-4">
                    {column.title}
                  </h3>
                  <ul className="space-y-3">
                    {column.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start mb-3">
                        <span
                          className="text-emerald-500 mr-3 mt-1 text-lg"
                          aria-hidden="true"
                        >
                          ✓
                        </span>
                        <span className="text-slate-800 leading-relaxed">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Practitioner Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-white to-amber-50/20 rounded-lg shadow-sm p-8">
            <div className="text-center">
              <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                Meet {practitioner.name}
              </h3>
              <p className="text-lg text-slate-800 mb-6 leading-relaxed">
                {practitioner.description}
              </p>

              {/* Location Highlight */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mb-8">
                <p className="text-slate-800 font-medium">
                  <strong>{practitioner.location.text}:</strong> Telehealth sessions available Australia-wide
                </p>
              </div>

              {/* CTA */}
              <div className="flex justify-center">
                <BookingButton
                  size="lg"
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                  {practitioner.cta.text}
                </BookingButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
