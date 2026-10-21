import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

/**
 * Reusable Card component that follows the new brand design system.
 *
 * Props:
 *  - title: optional string rendered as the card header.
 *  - children: the card body content.
 *  - className: additional Tailwind classes for the outer container.
 *  - headerClassName: Tailwind classes for the header element.
 *  - bodyClassName: Tailwind classes for the body element.
 */
export default function Card({
  title,
  children,
  className = '',
  headerClassName = '',
  bodyClassName = '',
}) {
  return (
    <div
      className={clsx(
        'bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700',
        'overflow-hidden',
        className
      )}
    >
      {title && (
        <div
          className={clsx(
            'px-4 py-2 bg-brand-100 dark:bg-brand-900 border-b border-gray-200 dark:border-gray-700',
            'text-lg font-semibold text-brand-800 dark:text-brand-200',
            headerClassName
          )}
        >
          {title}
        </div>
      )}
      <div className={clsx('p-4', bodyClassName)}>{children}</div>
    </div>
  );
}

Card.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  headerClassName: PropTypes.string,
  bodyClassName: PropTypes.string,
};

Card.defaultProps = {
  title: null,
  className: '',
  headerClassName: '',
  bodyClassName: '',
};
