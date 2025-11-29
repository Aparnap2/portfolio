const Section = ({ 
  id, 
  title, 
  subtitle,
  children, 
  className = '',
  containerClassName = ''
}) => {
  return (
    <section id={id} className={`py-16 ${className}`}>
      <div className={`max-w-6xl mx-auto px-4 ${containerClassName}`}>
        {title && (
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {title}
            </h2>
            {subtitle && (
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
};

export default Section;