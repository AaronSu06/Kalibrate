import { memo } from 'react';
import type { ServiceLocation } from '@/types';
import { CATEGORY_COLORS } from '@/types';

interface ServiceDetailProps {
  service: ServiceLocation;
  onBack: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  hospitals: 'Hospital',
  clinics: 'Clinic',
  grocery: 'Grocery',
  transportation: 'Transportation',
  religious: 'Place of Worship',
  gardens: 'Park & Garden',
  entertainment: 'Arts & Entertainment',
  education: 'Education',
  government: 'Government',
  emergency: 'Emergency Service',
  housing: 'Accommodation',
  fitness: 'Fitness & Recreation',
  banks: 'Bank & ATM',
  libraries: 'Library',
  daycare: 'Daycare',
};

const ServiceDetailComponent = ({ service, onBack }: ServiceDetailProps) => {
  const categoryColor = CATEGORY_COLORS[service.category];
  const categoryLabel = CATEGORY_LABELS[service.category] || service.category;

  const renderDetailValue = (value: unknown): React.ReactNode => {
    if (Array.isArray(value)) {
      return (
        <ul className="list-disc list-inside space-y-1">
          {value.map((item, index) => (
            <li key={index} className="text-white/70">
              {String(item)}
            </li>
          ))}
        </ul>
      );
    }
    if (typeof value === 'object' && value !== null) {
      return (
        <div className="space-y-2 pl-2 border-l border-white/10">
          {Object.entries(value).map(([k, v]) => (
            <div key={k}>
              <span className="text-white/50 text-sm capitalize">{k.replace(/_/g, ' ')}: </span>
              <span className="text-white/70">{String(v)}</span>
            </div>
          ))}
        </div>
      );
    }
    return <span className="text-white/70">{String(value)}</span>;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-6 py-4 text-white/60 hover:text-white/90 transition-colors"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span className="text-base font-medium">Back to categories</span>
      </button>

      {/* Service Info */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {/* Category Badge */}
        <div className="mb-4">
          <span
            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
            style={{
              backgroundColor: `${categoryColor}20`,
              color: categoryColor,
              border: `1px solid ${categoryColor}40`,
            }}
          >
            {categoryLabel}
          </span>
        </div>

        {/* Name */}
        <h2 className="text-2xl font-semibold text-white mb-2">
          {service.name}
        </h2>

        {/* Type/Description */}
        {service.description && (
          <p className="text-white/50 text-base mb-6">
            {service.description}
          </p>
        )}

        {/* Address */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-2">
            Address
          </h3>
          <p className="text-white/80 text-base">
            {service.address || 'Address not available'}
          </p>
        </div>

        {/* Coordinates */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-2">
            Coordinates
          </h3>
          <p className="text-white/60 text-sm font-mono">
            {service.coordinates.latitude.toFixed(6)}, {service.coordinates.longitude.toFixed(6)}
          </p>
        </div>

        {/* Details */}
        {service.details && Object.keys(service.details).length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-3">
              Details
            </h3>
            <div className="space-y-4 bg-white/[0.03] rounded-lg p-4">
              {Object.entries(service.details).map(([key, value]) => (
                <div key={key}>
                  <h4 className="text-white/60 text-sm font-medium capitalize mb-1">
                    {key.replace(/_/g, ' ')}
                  </h4>
                  {renderDetailValue(value)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Phone */}
        {service.phone && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-2">
              Phone
            </h3>
            <a
              href={`tel:${service.phone}`}
              className="text-white/80 text-base hover:text-white transition-colors"
            >
              {service.phone}
            </a>
          </div>
        )}

        {/* Website */}
        {service.website && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-2">
              Website
            </h3>
            <a
              href={service.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors break-all"
            >
              {service.website}
            </a>
          </div>
        )}

        {/* Hours */}
        {service.hours && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-2">
              Hours
            </h3>
            <p className="text-white/80 text-base">
              {service.hours}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export const ServiceDetail = memo(ServiceDetailComponent);
