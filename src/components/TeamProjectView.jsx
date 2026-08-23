import React from 'react';
import { 
  Users, 
  Building2, 
  GraduationCap, 
  Target, 
  MapPin, 
  Sprout, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Radio, 
  Mail, 
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { 
  PROJECT_DETAILS, 
  ORGANIZATION_DETAILS, 
  ADVISOR_DETAILS, 
  TEAM_MEMBERS, 
  FIELD_DETAILS 
} from '../data/projectData';

// Helper component to render placeholder badges
function PlaceholderTag({ text, label = "Placeholder" }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-dashed border-amber-500/40 font-mono text-xs">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
      <span>{text}</span>
      <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-amber-400/20 text-amber-200 font-semibold tracking-wider">
        {label}
      </span>
    </span>
  );
}

export default function TeamProjectView({ locationData, onBackToMap }) {
  const p = PROJECT_DETAILS;
  const org = ORGANIZATION_DETAILS;
  const adv = ADVISOR_DETAILS;
  const team = TEAM_MEMBERS;
  const fallbackField = FIELD_DETAILS.primarySite;
  const expField = FIELD_DETAILS.secondarySite;

  const locId = locationData?.id || fallbackField.id;
  const locName = locationData?.name || fallbackField.name;
  const lat = locationData?.latitude ?? 13.0094631;
  const lng = locationData?.longitude ?? 74.7952437;
  const formattedCoords = `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(4)}°${lng >= 0 ? 'E' : 'W'}`;
  const crop = locationData?.current_crop || fallbackField.currentCrop;
  const soilType = locationData?.soil_type || fallbackField.soilClassification;
  const coverageArea = locationData?.coverage_area || fallbackField.coverageArea;

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

        {/* Legend Notice for Placeholders */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-dashed border-amber-500/30 text-xs text-amber-300">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <span className="font-semibold block">Configurable Placeholders</span>
            <span className="text-[11px] text-amber-300/80">
              Values enclosed in dashed tags indicate pending details.
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Section 1: Project Overview & Objectives */}
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

            {/* Development Roadmap */}
            <div className="pt-4 border-t border-slate-800">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Development Roadmap & Milestones</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {p.roadmap.map((item, idx) => {
                  const isDone = item.status === 'Completed';
                  const isCurrent = item.status === 'Upcoming';
                  return (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                        isDone 
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                          : isCurrent 
                          ? 'bg-slate-950 border-amber-500/40 text-amber-300' 
                          : 'bg-slate-950/50 border-slate-800/80 text-slate-400'
                      }`}
                    >
                      <div className="mt-0.5">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : isCurrent ? (
                          <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-600 m-0.5"></div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-200">{item.phase}: {item.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-mono">{item.date} • {item.status}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
                    Organization / Company Name
                  </span>
                  <PlaceholderTag text={org.name} label="Entity" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Department</span>
                    <PlaceholderTag text={org.department} />
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Research Division</span>
                    <PlaceholderTag text={org.division} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Location / HQ</span>
                    <PlaceholderTag text={org.location} />
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Contact Email</span>
                    <PlaceholderTag text={org.contactEmail} />
                  </div>
                </div>

                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Core Focus</span>
                  <p className="text-xs text-slate-300 font-medium">{org.focusArea}</p>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-mono pt-3 border-t border-slate-800 flex items-center justify-between">
              <span>Status: Local Institutional Governance</span>
              <span>Ref: ORG_CONF_2026</span>
            </div>
          </div>

          {/* Project Advisor Card */}
          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 md:p-6 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-base font-bold text-emerald-400 mb-3">
                <GraduationCap className="w-5 h-5" />
                <h2>Project Advisor & Scientific Direction</h2>
              </div>

              <div className="space-y-3.5">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                    Advisor Name & Credentials
                  </span>
                  <div className="flex items-center gap-2">
                    <PlaceholderTag text={adv.name} label="Advisor" />
                  </div>
                  <div className="mt-1.5 text-xs text-slate-300 font-medium">
                    <PlaceholderTag text={adv.title} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Academic Affiliation</span>
                    <PlaceholderTag text={adv.affiliation} />
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Advisor Contact</span>
                    <PlaceholderTag text={adv.email} />
                  </div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1.5">Domain Expertise</span>
                  <div className="flex flex-wrap gap-1.5">
                    {adv.domainExpertise.map((exp, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[11px]">
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Advisory Scope</span>
                  <p className="text-xs text-slate-300 italic">{adv.notes}</p>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-mono pt-3 border-t border-slate-800 flex items-center justify-between">
              <span>Scientific Advisory Board</span>
              <span>Role: Academic Validation</span>
            </div>
          </div>

        </section>

        {/* Section 3: Team Members and Roles */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-base font-bold text-emerald-400">
              <Users className="w-5 h-5" />
              <h2>Project Team & Engineering Roster</h2>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
              {team.length} Active Positions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {team.map((member) => (
              <div 
                key={member.id} 
                className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  
                  {/* Top Bar with Member ID and Status */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono font-bold text-xs bg-slate-950 text-emerald-400 border border-slate-800 px-2 py-0.5 rounded">
                      {member.id}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {member.status}
                    </span>
                  </div>

                  {/* Name and Role */}
                  <div>
                    <PlaceholderTag text={member.name} label="Member" />
                    <h3 className="font-bold text-sm text-slate-100 mt-2">{member.role}</h3>
                    <p className="text-[11px] text-emerald-400/90 font-medium">{member.department}</p>
                  </div>

                  {/* Focus Description */}
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Responsibilities</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {member.focus}
                    </p>
                  </div>

                  {/* Contribution Tags */}
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1.5">Core Modules</span>
                    <div className="flex flex-wrap gap-1">
                      {member.contributions.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Email Placeholder */}
                <div className="pt-3 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-400">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <PlaceholderTag text={member.email} label="Contact" />
                </div>

              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Relevant Field / Pilot Project Specifications */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-emerald-400">
            <MapPin className="w-5 h-5" />
            <h2>Field & Pilot Deployment Specifications</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Primary Site Card: LOC_001 */}
            <div className="lg:col-span-2 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-emerald-500/40 p-5 md:p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-sm text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-500/40">
                      {locId}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                      Primary Active Pilot Site
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mt-1">{locName}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">GPS: {formattedCoords} • 112 m ASL</p>
                </div>

                <button
                  onClick={onBackToMap}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
                  title="View this location on Satellite Map"
                >
                  <Layers className="w-3.5 h-3.5" />
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
                  <span className="font-bold text-slate-200">{fallbackField.topography}</span>
                </div>
              </div>

              {/* Sensor Array Info */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-emerald-400" />
                    <span>Sensor Telemetry Array Architecture</span>
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {locationData?.sensor_id || 'SN_001'} (Active Node)
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  <strong className="text-slate-300">Hardware Probe:</strong> {fallbackField.sensorDeployment.nodeType}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Probe Depths</span>
                    <span className="text-slate-200 font-mono text-[11px]">{fallbackField.sensorDeployment.depthLevels.join(' | ')}</span>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Sampling & Protocol</span>
                    <span className="text-slate-200 font-mono text-[11px]">{fallbackField.sensorDeployment.samplingInterval}</span>
                  </div>
                </div>
              </div>

              {/* Agronomic Target Bounds */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">Target Moisture</div>
                  <div className="font-mono font-bold text-blue-400 mt-0.5">{fallbackField.soilBaseline.targetMoistureRange}</div>
                </div>
                <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">Target pH</div>
                  <div className="font-mono font-bold text-purple-400 mt-0.5">{fallbackField.soilBaseline.targetPH}</div>
                </div>
                <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">Max Salinity</div>
                  <div className="font-mono font-bold text-teal-400 mt-0.5">{fallbackField.soilBaseline.ecThreshold}</div>
                </div>
                <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">Organic Matter</div>
                  <div className="font-mono font-bold text-emerald-400 mt-0.5">{fallbackField.soilBaseline.organicMatter}</div>
                </div>
              </div>

            </div>

            {/* Expansion Site Card: LOC_002 */}
            <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 md:p-6 shadow-xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 text-base font-bold text-slate-300 mb-3">
                  <Sprout className="w-5 h-5 text-amber-400" />
                  <h2>Secondary Expansion Site</h2>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="font-mono font-bold text-xs bg-slate-950 text-slate-400 border border-slate-800 px-2 py-0.5 rounded">
                      {expField.id}
                    </span>
                    <div className="mt-1.5">
                      <PlaceholderTag text={expField.name} label="Planned Site" />
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Deployment Status</span>
                      <span className="text-amber-300 font-medium">{expField.status}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Planned Sensor Array</span>
                      <span className="text-slate-200 font-mono font-medium">{expField.estimatedSensors} Wireless Nodes</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Target Crop</span>
                      <PlaceholderTag text={expField.plannedCrop} />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Expansion node will introduce LoRaWAN wireless ground telemetry nodes to compare cross-parcel soil microbial and moisture retention variances.
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 font-mono pt-3 border-t border-slate-800">
                Phase 2 Scalability Pipeline
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
