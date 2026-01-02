# Epic: Bloom Telehealth - End-to-End Solution

**Epic Owner:** Zoe Semmler  
**Target Start:** Week of January 6, 2025  
**Status:** Planning  

---

## Problem Statement

### Current Workflow (Manual & Fragmented)
1. **Zoom** - Clinician starts a Zoom room for telehealth session
2. **AI Tool** - Separate recording/transcription tool captures the session
3. **Manual Copy** - Clinician copies AI-generated notes
4. **Halaxy Paste** - Clinician manually pastes notes into Halaxy
5. **Context Loss** - No automatic client history/context before sessions

### Pain Points
- Multiple tools = context switching
- Manual copy/paste = time sink & error prone
- No unified experience under Bloom brand
- Client data fragmented across systems
- No session prep workflow
- Consent/recording managed separately

---

## Vision

**A single Bloom experience** where clinicians can:
1. See who's next on their calendar
2. Review client context with one click
3. Start a secure video session
4. Have notes auto-generated and saved
5. Never touch Halaxy directly for notes

> "Open Bloom, see your day, click to start, focus on the client, notes done."

---

## Proposed Solution

### Phase 1: Video Integration (MVP)
**Goal:** Replace Zoom with Bloom-branded video

| Feature | Description | Tech Options |
|---------|-------------|--------------|
| Video Calling | 1:1 secure video for telehealth | Daily.co, Whereby, Twilio, WebRTC |
| Waiting Room | Client sees branded waiting room before clinician joins | Custom UI |
| Session Timer | Track session duration | Built-in |
| Recording Consent | Client consent before recording starts | UI + legal |

**Considerations:**
- HIPAA/Privacy Act compliance (Australian healthcare data)
- Recording storage location (Azure Blob in Australia East?)
- Client-side vs server-side recording
- Bandwidth requirements for clinicians

### Phase 2: AI Session Notes
**Goal:** Auto-generate clinical notes from sessions

| Feature | Description | Tech Options |
|---------|-------------|--------------|
| Audio Transcription | Real-time or post-session transcription | Azure Speech, Whisper, AssemblyAI |
| Note Generation | AI-generated clinical notes from transcript | Azure OpenAI, GPT-4 |
| Note Templates | Configurable note formats (SOAP, DAP, etc.) | Template system |
| Clinician Review | Review/edit before finalizing | UI |

**Considerations:**
- Transcript accuracy for clinical terminology
- AI hallucination risks in medical notes
- Clinician must review before saving (legal requirement)
- Storage/retention of transcripts vs notes only

### Phase 3: Halaxy Integration
**Goal:** Seamless sync with practice management

| Feature | Description | Tech Options |
|---------|-------------|--------------|
| Push Notes | One-click send notes to Halaxy | Halaxy API |
| Pull Client Context | Show client history before session | Halaxy API |
| Calendar Sync | Bloom calendar reflects Halaxy appointments | Halaxy API, existing sync |
| Billing Trigger | Mark session complete, trigger billing | Halaxy API |

**Considerations:**
- Halaxy API rate limits
- Field mapping (Bloom note format → Halaxy fields)
- Error handling if sync fails
- Offline resilience

### Phase 4: Session Prep & Context
**Goal:** Clinician is prepared before every session

| Feature | Description |
|---------|-------------|
| Pre-Session Summary | AI summary of client's last 3 sessions |
| Risk Flags | Highlight any noted risk factors |
| Treatment Goals | Show current treatment plan goals |
| Quick Actions | "Start session", "View full history", "Reschedule" |

---

## User Stories

### Clinician Stories
1. **As a clinician**, I want to start a video session from my Bloom calendar so I don't need to switch to Zoom
2. **As a clinician**, I want session notes auto-generated so I can focus on the client, not typing
3. **As a clinician**, I want to review and edit AI notes before saving so I maintain clinical accuracy
4. **As a clinician**, I want notes pushed to Halaxy automatically so I never copy/paste again
5. **As a clinician**, I want to see client context before a session so I'm prepared

### Client Stories
1. **As a client**, I want a simple link to join my session so I don't need to install anything
2. **As a client**, I want to consent to recording clearly so I understand what's being captured
3. **As a client**, I want a professional waiting room so I feel confident in my provider

---

## Technical Architecture (Draft)

```
┌─────────────────────────────────────────────────────────────┐
│                      Bloom Web App                          │
├─────────────────────────────────────────────────────────────┤
│  Calendar View  │  Session View  │  Notes Review  │  History│
└────────┬────────┴───────┬────────┴───────┬────────┴────┬────┘
         │                │                │             │
         ▼                ▼                ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Bloom API (Azure Functions)              │
├─────────────────────────────────────────────────────────────┤
│  /sessions  │  /transcripts  │  /notes  │  /halaxy-sync    │
└──────┬──────┴───────┬────────┴─────┬────┴────────┬─────────┘
       │              │              │             │
       ▼              ▼              ▼             ▼
┌──────────┐  ┌──────────────┐  ┌─────────┐  ┌──────────┐
│ Daily.co │  │ Azure Speech │  │ Azure   │  │ Halaxy   │
│ Video    │  │ Transcription│  │ OpenAI  │  │ API      │
└──────────┘  └──────────────┘  └─────────┘  └──────────┘
       │              │              │
       ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│              Azure Blob Storage (Australia East)            │
│         Recordings │ Transcripts │ Generated Notes          │
└─────────────────────────────────────────────────────────────┘
```

---

## Data & Privacy Considerations

### Australian Healthcare Requirements
- [ ] Data must be stored in Australia
- [ ] Comply with Privacy Act 1988
- [ ] Meet AHPRA record-keeping guidelines
- [ ] Client consent for recording (explicit, revocable)
- [ ] Retention periods (7 years minimum for health records)

### Security
- [ ] End-to-end encryption for video
- [ ] Encryption at rest for recordings/transcripts
- [ ] Access controls (clinician can only see their clients)
- [ ] Audit logging for all data access
- [ ] Secure deletion when retention expires

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Time from session end to notes complete | ~15 mins | < 3 mins |
| Tools used per session | 4 (Zoom, AI, Halaxy, Email) | 1 (Bloom) |
| Clinician satisfaction | TBD | > 4.5/5 |
| Client no-show rate | TBD | Reduce by 10% (reminders) |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI note accuracy | Clinical errors | Mandatory clinician review |
| Video quality issues | Poor client experience | Fallback to Zoom link |
| Halaxy API downtime | Notes not synced | Queue & retry, manual export |
| Cost of video/AI services | Margin impact | Usage-based pricing analysis |
| Regulatory changes | Compliance gap | Legal review before launch |

---

## Open Questions

1. **Video Provider:** Daily.co vs Whereby vs Twilio vs build on WebRTC?
2. **Recording Storage:** How long to keep recordings vs transcripts vs notes?
3. **Pricing:** Does 80% split still work with added infrastructure costs?
4. **Client App:** Do clients need an app or browser-only?
5. **Offline:** What happens if internet drops mid-session?
6. **Multi-clinician:** Any scenarios with multiple clinicians in one session?

---

## Rough Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Video MVP | 2-3 weeks | Video provider selection |
| Phase 2: AI Notes | 2-3 weeks | Transcription accuracy testing |
| Phase 3: Halaxy Sync | 1-2 weeks | Halaxy API access |
| Phase 4: Session Prep | 1-2 weeks | Phases 1-3 complete |
| **Total** | **6-10 weeks** | |

---

## Next Steps

1. [ ] Review this doc with Zoe
2. [ ] Select video provider (recommend Daily.co for healthcare focus)
3. [ ] Halaxy API access & documentation review
4. [ ] Privacy/legal review for recording consent
5. [ ] Spike: Test transcription accuracy with clinical audio samples
6. [ ] Design: Session flow mockups

---

*Created: December 29, 2025*  
*Last Updated: December 29, 2025*
