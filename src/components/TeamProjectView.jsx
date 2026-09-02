import React from 'react';
import { 
  Users, 
  Building2, 
  GraduationCap, 
  Target, 
  MapPin, 
  Sprout, 
  Radio, 
  Mail, 
  ArrowLeft,
  Award
} from 'lucide-react';
import { 
  PROJECT_DETAILS, 
  ORGANIZATION_DETAILS, 
  ADVISOR_DETAILS, 
  TEAM_MEMBERS, 
  FIELD_DETAILS 
} from '../data/projectData';

export default function TeamProjectView({ locationData, onBackToMap }) {
  const p = PROJECT_DETAILS;
  const org = ORGANIZATION_DETAILS;
  const adv = ADVISOR_DETAILS;
  const team = TEAM_MEMBERS;
  const primaryField = FIELD_DETAILS.primarySite;
  const secondaryField = FIELD_DETAILS.secondarySite;

  const locId = locationData?.id || primaryField.id;
  const locName = locationData?.name || primaryField.name;
  const lat = locationData?.latitude ?? 13.0094631;
  const lng = locationData?.longitude ?? 74.7952437;
  const formattedCoords = `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(4)}°${lng >= 0 ? 'E' : 'W'}`;
  const crop = locationData?.current_crop || primaryField.currentCrop;
  const soilType = locationData?.soil_type || primaryField.soilClassification;
  const coverageArea = locationData?.coverage_area || primaryField.coverageArea;

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-slate-950 text-slate-100 p-4 md:p-6 lg:p-8 space-y-8 font-sans">
      
      {/* Top Banner / Breadcrumb Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToMap}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all shadow-sm"
              title="Return to Live Satellite Map"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span>Back to Map View</span>
            </button>

            <span className="text-slate-600">•</span>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                {p.version}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {p.status}
              </span>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-50 mt-2">
            Team & Project Directory
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Overview of the TerraPulse Soil Health Monitoring architecture, institutional governance, research advisor, engineering team roster, and pilot field deployment specs.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Section 1: Project Architecture & Objectives */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-emerald-400">
            <Target className="w-5 h-5" />
            <h2>Project Architecture & Objectives</h2>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 md:p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-100">{p.title}</h3>
              <p className="text-xs font-semibold text-emerald-400 mt-0.5">{p.tagline}</p>
              <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                {p.summary}
              </p>
            </div>

            {/* 4 Objective Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {p.objectives.map((obj, idx) => (
                <div key={idx} className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/90 space-y-2 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-mono">
                      0{idx + 1}
                    </span>
                    <span>{obj.title}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {obj.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: Organization & Project Advisor */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Organization Information Card */}
          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 md:p-6 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-base font-bold text-emerald-400 mb-3">
                <Building2 className="w-5 h-5" />
                <h2>Organization / Institutional Details</h2>
              </div>

              <div className="space-y-3.5">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                    Organization / Entity Name
                  </span>
                  <div className="text-sm font-bold text-slate-100 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    {org.name}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Department</span>
                    <span className="text-xs font-medium text-slate-200">{org.department}</span>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Division / Laboratory</span>
                    <span className="text-xs font-medium text-slate-200">{org.division}</span>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Location / HQ</span>
                  <span className="text-xs font-medium text-slate-200 leading-relaxed block">{org.location}</span>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Contact Email</span>
                  <a href={`mailto:${org.contactEmail}`} className="text-xs font-mono text-emerald-400 hover:underline">
                    {org.contactEmail}
                  </a>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-mono pt-3 border-t border-slate-800 flex items-center justify-between">
              <span>Status: Institutional Record</span>
              <span>Ref: {org.reference || 'ORG_2026'}</span>
            </div>
          </div>

          {/* Project Advisor Card */}
          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 md:p-6 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-base font-bold text-emerald-400 mb-3">
                <GraduationCap className="w-5 h-5" />
                <h2>Project Advisor Details</h2>
              </div>

              <div className="space-y-3.5">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                    Advisor Name & Title
                  </span>
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-sm font-bold text-slate-100">{adv.name}</div>
                    <div className="text-xs text-emerald-400 font-medium mt-0.5">{adv.title}</div>
                  </div>
                </div>

                {adv.additionalRole && (
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Additional Role</span>
                    <span className="text-xs font-medium text-slate-200">{adv.additionalRole}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Affiliation</span>
                    <span className="text-xs font-medium text-slate-200">{adv.affiliation}</span>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Department</span>
                    <span className="text-xs font-medium text-slate-200">{adv.department}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Advisor Email</span>
                    <a href={`mailto:${adv.email}`} className="text-xs font-mono text-emerald-400 hover:underline">
                      {adv.email}
                    </a>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Office</span>
                    <span className="text-xs font-medium text-slate-200">{adv.office}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-mono pt-3 border-t border-slate-800 flex items-center justify-between">
              <span>Scientific Direction</span>
              <span>Ref: {adv.reference || 'ADV_2026'}</span>
            </div>
          </div>

        </section>

        {/* Section 3: Project Team / Engineering Roster */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-base font-bold text-emerald-400">
              <Users className="w-5 h-5" />
              <h2>Project Team / Engineering Roster</h2>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-lg font-bold">
              {team.length} Positions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {team.map((member) => (
              <div 
                key={member.id} 
                className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl hover:border-slate-700 transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono font-bold text-xs bg-slate-950 text-emerald-400 border border-slate-800 px-2 py-0.5 rounded">
                    {member.id}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    {member.status || 'Active'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Name</span>
                    <div className="text-sm font-bold text-slate-100">{member.name}</div>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Department</span>
                    <div className="text-xs font-medium text-slate-200">{member.department}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Role / Responsibility</span>
                    <div className="text-xs font-mono text-slate-400">{member.role || '—'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Relevant Field / Pilot Deployment Specifications */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-emerald-400">
            <MapPin className="w-5 h-5" />
            <h2>Field & Pilot Deployment Specifications</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Primary Site Card: LOC_001 (Idea Factory) */}
            <div className="lg:col-span-2 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-emerald-500/40 p-5 md:p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-sm text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-500/40">
                      {locId}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                      Primary Active Site
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mt-1">{locName}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">GPS: {formattedCoords} • Elevation: {primaryField.elevation}</p>
                </div>

                <button
                  onClick={onBackToMap}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
                  title="View Idea Factory on Satellite Map"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Inspect on Map</span>
                </button>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Coverage Area</span>
                  <span className="font-bold text-slate-200">{coverageArea}</span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Soil Classification</span>
                  <span className="font-bold text-slate-200">{soilType}</span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Current Crop</span>
                  <span className="font-bold text-emerald-400 capitalize">{crop}</span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Topography</span>
                  <span className="font-bold text-slate-200">{primaryField.topography}</span>
                </div>
              </div>

              {/* Sensor Array Info */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-emerald-400" />
                    <span>Active Telemetry Hardware</span>
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {locationData?.sensor_id || 'SN_001'} (Online)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Sampling Protocol</span>
                    <span className="text-slate-200 font-mono text-[11px]">{primaryField.sensorDeployment.samplingInterval}</span>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Transmission</span>
                    <span className="text-slate-200 font-mono text-[11px]">{primaryField.sensorDeployment.transmissionProtocol}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Secondary Site Card: LOC_002 (Test Location) */}
            <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 md:p-6 shadow-xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 text-base font-bold text-slate-300 mb-3">
                  <Sprout className="w-5 h-5 text-amber-400" />
                  <h2>Secondary Test Location</h2>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="font-mono font-bold text-xs bg-slate-950 text-slate-400 border border-slate-800 px-2 py-0.5 rounded">
                      {secondaryField.id}
                    </span>
                    <h3 className="font-bold text-sm text-slate-200 mt-1">{secondaryField.name}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">GPS: {secondaryField.coordinates}</p>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Status</span>
                      <span className="text-amber-300 font-medium">{secondaryField.status}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Target Crop</span>
                      <span className="text-xs font-medium text-slate-300">{secondaryField.plannedCrop}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Test node for verifying multi-location telemetry and spatial dashboard switching.
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 font-mono pt-3 border-t border-slate-800">
                Multi-Location Test Node
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
