import { useLazyLoad } from '../../hooks/useLazyLoad';

const LazySection = ({ children, fallback = null, className = '' }) => {
  const [ref, isVisible] = useLazyLoad();

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : fallback}
    </div>
  );
};

export default LazySection;