'use client'

import React from 'react'

interface PageHeaderProps {
  breadcrumb?: string
  title: React.ReactNode
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export default function PageHeader({
  breadcrumb,
  title,
  subtitle,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 ${className}`}>
      <div className="space-y-1 max-w-2xl">
        {breadcrumb && (
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600/80 dark:text-emerald-400">
            {breadcrumb}
          </p>
        )}
        <h1 className="text-2xl md:text-3xl font-black text-[#092B2B] dark:text-white tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-3 shrink-0 pt-2 md:pt-0">
          {actions}
        </div>
      )}
    </div>
  )
}
