"use strict";
/**
 * Halaxy Sync Service - Main Export
 *
 * Real-time synchronization between Halaxy Practice Management System
 * and Bloom's local database for fast dashboard rendering.
 *
 * Architecture:
 * - Primary: Webhooks (real-time, ~1-5 second latency)
 * - Backup: Scheduled sync (every 15 minutes, catches missed events)
 *
 * @see docs/HALAXY_SYNC_SERVICE.md - Full architecture specification
 * @see docs/HALAXY_SYNC_COMPLIANCE_GUIDE.md - Compliance requirements
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHalaxySyncService = exports.HalaxySyncService = exports.getPractitionerIdFromAppointment = exports.getPatientIdFromAppointment = exports.extractIdFromReference = exports.isActiveStatus = exports.isCompletedStatus = exports.mapAppointmentStatus = exports.transformAppointment = exports.transformPatient = exports.transformPractitioner = exports.HalaxyApiError = exports.getHalaxyClient = exports.HalaxyClient = exports.getHalaxyConfig = exports.getTokenStatus = exports.hasCredentials = exports.invalidateToken = exports.getAccessToken = void 0;
// Types
__exportStar(require("./types"), exports);
// Token Management
var token_manager_1 = require("./token-manager");
Object.defineProperty(exports, "getAccessToken", { enumerable: true, get: function () { return token_manager_1.getAccessToken; } });
Object.defineProperty(exports, "invalidateToken", { enumerable: true, get: function () { return token_manager_1.invalidateToken; } });
Object.defineProperty(exports, "hasCredentials", { enumerable: true, get: function () { return token_manager_1.hasCredentials; } });
Object.defineProperty(exports, "getTokenStatus", { enumerable: true, get: function () { return token_manager_1.getTokenStatus; } });
Object.defineProperty(exports, "getHalaxyConfig", { enumerable: true, get: function () { return token_manager_1.getHalaxyConfig; } });
// API Client
var client_1 = require("./client");
Object.defineProperty(exports, "HalaxyClient", { enumerable: true, get: function () { return client_1.HalaxyClient; } });
Object.defineProperty(exports, "getHalaxyClient", { enumerable: true, get: function () { return client_1.getHalaxyClient; } });
Object.defineProperty(exports, "HalaxyApiError", { enumerable: true, get: function () { return client_1.HalaxyApiError; } });
// Entity Transformers
var transformers_1 = require("./transformers");
Object.defineProperty(exports, "transformPractitioner", { enumerable: true, get: function () { return transformers_1.transformPractitioner; } });
Object.defineProperty(exports, "transformPatient", { enumerable: true, get: function () { return transformers_1.transformPatient; } });
Object.defineProperty(exports, "transformAppointment", { enumerable: true, get: function () { return transformers_1.transformAppointment; } });
Object.defineProperty(exports, "mapAppointmentStatus", { enumerable: true, get: function () { return transformers_1.mapAppointmentStatus; } });
Object.defineProperty(exports, "isCompletedStatus", { enumerable: true, get: function () { return transformers_1.isCompletedStatus; } });
Object.defineProperty(exports, "isActiveStatus", { enumerable: true, get: function () { return transformers_1.isActiveStatus; } });
Object.defineProperty(exports, "extractIdFromReference", { enumerable: true, get: function () { return transformers_1.extractIdFromReference; } });
Object.defineProperty(exports, "getPatientIdFromAppointment", { enumerable: true, get: function () { return transformers_1.getPatientIdFromAppointment; } });
Object.defineProperty(exports, "getPractitionerIdFromAppointment", { enumerable: true, get: function () { return transformers_1.getPractitionerIdFromAppointment; } });
// Sync Service
var sync_service_1 = require("./sync-service");
Object.defineProperty(exports, "HalaxySyncService", { enumerable: true, get: function () { return sync_service_1.HalaxySyncService; } });
Object.defineProperty(exports, "getHalaxySyncService", { enumerable: true, get: function () { return sync_service_1.getHalaxySyncService; } });
//# sourceMappingURL=index.js.map