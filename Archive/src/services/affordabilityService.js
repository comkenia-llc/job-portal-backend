const ADVANCED_BASE = {
    rentByHousing: {
        shared: 1400,
        studio: 2500,
        "1br": 3500,
        "2br": 4200,
        "3br": 6000,
    },
    foodPerPerson: 750,
    utilitiesBase: 260,
    utilitiesPerPerson: 70,
    internetBase: 180,
    internetPerPerson: 35,
    transportPublicBase: 300,
    transportPublicPerPerson: 80,
    transportCarBase: 700,
    transportCarPerPerson: 120,
    miscPerPerson: 320,
};

function getVerdict(salary, totalCost) {
    const ratio = salary / totalCost;

    if (ratio < 1) {
        return {
            label: "Not enough",
            description:
                "This salary is below the estimated monthly cost and may be difficult for normal living in Dubai.",
        };
    }

    if (ratio < 1.15) {
        return {
            label: "Survival only",
            description:
                "This salary may cover essentials, but savings and flexibility will be very limited.",
        };
    }

    if (ratio < 1.35) {
        return {
            label: "Manageable",
            description:
                "This salary can support a basic to moderate lifestyle with budgeting.",
        };
    }

    if (ratio < 1.75) {
        return {
            label: "Comfortable",
            description:
                "This salary can support a reasonably comfortable lifestyle in Dubai.",
        };
    }

    return {
        label: "Good savings possible",
        description:
            "This salary can support comfortable living with stronger savings potential.",
    };
}

function sanitizeNumber(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
}

function clampNumber(value, min, max, fallback) {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    return Math.max(min, Math.min(max, num));
}

function applyMultipliers(costs, multipliers) {
    const adjusted = { ...costs };
    Object.entries(multipliers || {}).forEach(([key, value]) => {
        if (Number.isFinite(value) && adjusted[key] !== undefined) {
            adjusted[key] = Math.round(adjusted[key] * value);
        }
    });
    return adjusted;
}

function calculateDubaiAffordability({
    salary,
    profileKey,
    overrides = {},
    familySize = 1,
    neighborhoodTier = "mid",
    neighborhoodRentMultiplier = null,
    housingType = "studio",
    transportMode = "public",
}) {
    const normalizedFamilySize = clampNumber(familySize, 1, 8, 1);

    const parsedNeighborhoodMultiplier = Number(neighborhoodRentMultiplier);
    const neighborhoodMultiplier =
        Number.isFinite(parsedNeighborhoodMultiplier) &&
        parsedNeighborhoodMultiplier > 0
            ? parsedNeighborhoodMultiplier
        : neighborhoodTier === "budget"
        ? 0.85
        : neighborhoodTier === "premium"
        ? 1.3
        : 1;

    const baseRent =
        ADVANCED_BASE.rentByHousing[housingType] ||
        ADVANCED_BASE.rentByHousing.studio;
    const computedCosts = {
        rent: Math.round(baseRent * neighborhoodMultiplier),
        food: Math.round(ADVANCED_BASE.foodPerPerson * normalizedFamilySize),
        utilities: Math.round(
            ADVANCED_BASE.utilitiesBase +
                ADVANCED_BASE.utilitiesPerPerson * normalizedFamilySize
        ),
        internet_mobile: Math.round(
            ADVANCED_BASE.internetBase +
                ADVANCED_BASE.internetPerPerson * normalizedFamilySize
        ),
        transport: Math.round(
            (transportMode === "car"
                ? ADVANCED_BASE.transportCarBase
                : ADVANCED_BASE.transportPublicBase) +
                (transportMode === "car"
                    ? ADVANCED_BASE.transportCarPerPerson
                    : ADVANCED_BASE.transportPublicPerPerson) *
                    normalizedFamilySize
        ),
        misc: Math.round(ADVANCED_BASE.miscPerPerson * normalizedFamilySize),
    };

    const finalCosts = {
        rent: sanitizeNumber(overrides.rent) ?? computedCosts.rent,
        food: sanitizeNumber(overrides.food) ?? computedCosts.food,
        transport: sanitizeNumber(overrides.transport) ?? computedCosts.transport,
        utilities: sanitizeNumber(overrides.utilities) ?? computedCosts.utilities,
        internet_mobile:
            sanitizeNumber(overrides.internet_mobile) ?? computedCosts.internet_mobile,
        misc: sanitizeNumber(overrides.misc) ?? computedCosts.misc,
    };

    const totalCost =
        finalCosts.rent +
        finalCosts.food +
        finalCosts.transport +
        finalCosts.utilities +
        finalCosts.internet_mobile +
        finalCosts.misc;

    const leftover = salary - totalCost;
    const verdict = getVerdict(salary, totalCost);
    const ratio = salary / totalCost;
    const affordabilityScore = Math.max(
        0,
        Math.min(100, Math.round((ratio / 2) * 100))
    );
    const savingsRate = salary > 0 ? leftover / salary : 0;

    return {
        city: "Dubai",
        currency: "AED",
        salary,
        profileKey: profileKey || "advanced",
        profileLabel: "Advanced household model",
        costs: finalCosts,
        totalCost,
        leftover,
        verdict,
        savingsRate,
        affordabilityScore,
        modifiers: {
            familySize: normalizedFamilySize,
            neighborhoodTier,
            housingType,
            transportMode,
            neighborhoodMultiplier,
        },
    };
}

module.exports = {
    calculateDubaiAffordability,
};
