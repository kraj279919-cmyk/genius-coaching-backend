const InstituteSettings = require('../models/InstituteSettings');

/**
 * Service to aggregate configuration settings safely
 * Does not expose environment secrets.
 */
class ConfigService {
  static async getConfig() {
    let settings = await InstituteSettings.findOne().lean();
    if (!settings) {
      settings = {
        academicSession: '2025-26',
        features: {},
        emergency: {}
      };
    }
    return {
      academicSession: settings.academicSession,
      maintenanceMode: settings.emergency?.maintenanceMode || false,
      aiEnabled: settings.features?.ai || false,
      notificationsEnabled: true, // Master switch can be added later
      publicWebsiteEnabled: settings.features?.websiteCms !== false
    };
  }

  static async getAcademicSession() {
    const config = await this.getConfig();
    return config.academicSession;
  }

  static async isMaintenanceMode() {
    const config = await this.getConfig();
    return config.maintenanceMode;
  }
}

module.exports = ConfigService;
