"use strict";
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
// Azure Functions v4 entry point
// This file imports all function modules to register them
require("./functions/health");
require("./functions/applications");
require("./functions/upload");
require("./functions/get-document-url");
require("./functions/ab-test");
require("./functions/track-ab-test");
require("./functions/dbvc");
require("./functions/smoke-test");
require("./functions/practitioner-dashboard");
require("./functions/list-practitioners");
require("./functions/seed-database");
require("./functions/store-booking-session");
require("./functions/get-halaxy-availability");
require("./functions/create-halaxy-booking");
require("./functions/create-payment-intent");
require("./functions/capture-payment");
require("./functions/cancel-payment");
require("./functions/halaxy-sync-timer");
require("./functions/trigger-halaxy-sync");
require("./functions/halaxy-api-discovery");
require("./functions/debug-slots");
require("./functions/fix-unix-timestamps");
require("./functions/send-verification-code");
require("./functions/verify-code");
__exportStar(require("./functions/health"), exports);
__exportStar(require("./functions/applications"), exports);
__exportStar(require("./functions/upload"), exports);
__exportStar(require("./functions/get-document-url"), exports);
__exportStar(require("./functions/ab-test"), exports);
__exportStar(require("./functions/track-ab-test"), exports);
__exportStar(require("./functions/smoke-test"), exports);
__exportStar(require("./functions/practitioner-dashboard"), exports);
__exportStar(require("./functions/seed-database"), exports);
__exportStar(require("./functions/store-booking-session"), exports);
//# sourceMappingURL=index.js.map