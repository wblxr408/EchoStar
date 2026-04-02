import { calculateDistance } from './geo';

const GENERIC_LOCAL_TOKENS = [
  '大学',
  '医院',
  '学校',
  '小学',
  '中学',
  '幼儿园',
  '公园',
  '景区',
  '景点',
  '博物馆',
  '图书馆',
  '商场',
  '超市',
  '便利店',
  '菜市场',
  '餐厅',
  '饭店',
  '美食',
  '火锅',
  '烧烤',
  '面馆',
  '早餐',
  '咖啡',
  '咖啡馆',
  '奶茶',
  '酒店',
  '宾馆',
  '民宿',
  '药店',
  '银行',
  '健身房',
  '体育馆',
  '地铁站',
  '公交站',
  '车站',
  '火车站',
  '高铁站',
  '机场',
  '小区',
  '社区',
  '住宅'
];

const LOCAL_INTENT_PREFIXES = [
  '附近',
  '周边',
  '周围',
  '最近',
  '这边',
  '这里',
  '旁边'
];

const CATEGORY_TYPE_RULES = [
  {
    keywords: ['小区', '社区', '住宅'],
    type: '商务住宅',
    preferBlankKeyword: true,
    nearbyOnly: true
  },
  {
    keywords: ['饭店', '餐厅', '美食', '火锅', '烧烤', '面馆', '早餐', '咖啡', '咖啡馆', '奶茶'],
    type: '餐饮服务',
    preferBlankKeyword: true,
    nearbyOnly: true
  },
  {
    keywords: ['酒店', '宾馆', '民宿'],
    type: '住宿服务',
    preferBlankKeyword: true,
    nearbyOnly: true
  },
  {
    keywords: ['医院', '药店'],
    type: '医疗保健服务',
    preferBlankKeyword: true,
    nearbyOnly: true
  },
  {
    keywords: ['大学', '学校', '小学', '中学', '幼儿园', '图书馆', '博物馆'],
    type: '科教文化服务',
    preferBlankKeyword: true,
    nearbyOnly: true
  },
  {
    keywords: ['公园', '景区', '景点'],
    type: '风景名胜',
    preferBlankKeyword: true,
    nearbyOnly: true
  },
  {
    keywords: ['商场', '超市', '便利店', '菜市场'],
    type: '购物服务',
    preferBlankKeyword: true,
    nearbyOnly: true
  },
  {
    keywords: ['银行'],
    type: '金融保险服务',
    preferBlankKeyword: true,
    nearbyOnly: true
  },
  {
    keywords: ['地铁站', '公交站', '车站', '火车站', '高铁站', '机场'],
    type: '交通设施服务',
    preferBlankKeyword: true,
    nearbyOnly: true
  }
];

const ANCILLARY_NAME_TOKENS = [
  '路',
  '街',
  '大道',
  '胡同',
  '巷',
  '弄',
  '桥',
  '里',
  '村',
  '苑',
  '城',
  '大厦',
  '广场',
  '中心'
];

const ANCILLARY_TYPE_TOKENS = [
  '道路',
  '地名地址信息',
  '公交',
  '地铁',
  '门牌',
  '楼栋'
];

const LANDMARK_SUFFIX_TOKENS = [
  '国家考古遗址公园',
  '遗址公园',
  '风景名胜区',
  '旅游景区',
  '国家公园',
  '国家森林公园',
  '国家湿地公园',
  '博物馆',
  '文化遗址',
  '艺术中心',
  '度假区',
  '旧址',
  '公园',
  '景区',
  '广场'
];

const BRANCH_NAME_TOKENS = [
  '店',
  '分店',
  '旗舰店',
  '直营店',
  '总店',
  '门店'
];

function toFiniteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function pickFirstString(...values) {
  for (const value of values.flat()) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s·•\-—_/\\()（）【】\[\]{}.,，。!?！？:;"'`~]+/g, '');
}

function stripLocalIntentPrefix(keywordNormalized) {
  let current = keywordNormalized;
  let changed = true;

  while (changed) {
    changed = false;
    for (const prefix of LOCAL_INTENT_PREFIXES) {
      const normalizedPrefix = normalizeText(prefix);
      if (normalizedPrefix && current.startsWith(normalizedPrefix)) {
        current = current.slice(normalizedPrefix.length);
        changed = true;
      }
    }
  }

  return current;
}

function stripLandmarkSuffix(nameNormalized) {
  return LANDMARK_SUFFIX_TOKENS.reduce((current, token) => {
    const normalizedToken = normalizeText(token);
    if (!normalizedToken || !current.endsWith(normalizedToken)) {
      return current;
    }

    return current.slice(0, Math.max(0, current.length - normalizedToken.length));
  }, nameNormalized);
}

function normalizeLocality(locality) {
  if (!locality || typeof locality !== 'object') {
    return null;
  }

  const city = pickFirstString(locality.city, locality.cityName);
  const district = pickFirstString(locality.district, locality.area);
  const adcode = pickFirstString(locality.adcode);
  const province = pickFirstString(locality.province);

  if (!city && !district && !adcode && !province) {
    return null;
  }

  return {
    city,
    district,
    adcode,
    province
  };
}

function resolveCityConstraint(locality) {
  const normalized = normalizeLocality(locality);
  if (!normalized) {
    return '';
  }

  return pickFirstString(
    normalized.city,
    normalized.adcode,
    normalized.district,
    normalized.province
  );
}

function resolveTypeIntent(keywordNormalized) {
  const strippedKeyword = stripLocalIntentPrefix(keywordNormalized);
  return CATEGORY_TYPE_RULES.find((rule) => rule.keywords.some((keyword) => normalizeText(keyword) === strippedKeyword)) || null;
}

function isGenericLocalIntent(keywordNormalized) {
  const strippedKeyword = stripLocalIntentPrefix(keywordNormalized);
  if (!strippedKeyword) {
    return false;
  }

  return GENERIC_LOCAL_TOKENS.some((token) => normalizeText(token) === strippedKeyword);
}

function getPoiKey(poi) {
  if (poi?.id) {
    return String(poi.id);
  }

  const latitude = toFiniteNumber(poi?.latitude ?? poi?.lat);
  const longitude = toFiniteNumber(poi?.longitude ?? poi?.lng);
  return `${normalizeText(poi?.name)}-${longitude ?? 'x'}-${latitude ?? 'y'}`;
}

function getDistanceMeters(poi, anchor) {
  const explicitDistance = toFiniteNumber(poi?.distance);
  if (explicitDistance !== null) {
    return explicitDistance;
  }

  const poiLat = toFiniteNumber(poi?.latitude ?? poi?.lat);
  const poiLng = toFiniteNumber(poi?.longitude ?? poi?.lng);
  const anchorLat = toFiniteNumber(anchor?.latitude ?? anchor?.lat);
  const anchorLng = toFiniteNumber(anchor?.longitude ?? anchor?.lng);

  if ([poiLat, poiLng, anchorLat, anchorLng].some((value) => value === null)) {
    return Number.POSITIVE_INFINITY;
  }

  return calculateDistance(anchorLat, anchorLng, poiLat, poiLng);
}

function getMatchProfile(poi, keywordNormalized) {
  const name = normalizeText(poi?.name);
  const baseName = stripLandmarkSuffix(name);
  const address = normalizeText(poi?.address);
  const district = normalizeText([poi?.city, poi?.district].filter(Boolean).join(' '));
  const type = normalizeText(poi?.type);

  const exactNameMatch = Boolean(keywordNormalized) && (name === keywordNormalized || baseName === keywordNormalized);
  const prefixNameMatch = !exactNameMatch
    && Boolean(keywordNormalized)
    && (
      name.startsWith(keywordNormalized)
      || (baseName && baseName.startsWith(keywordNormalized))
    );
  const containsNameMatch = !exactNameMatch
    && !prefixNameMatch
    && Boolean(keywordNormalized)
    && (
      name.includes(keywordNormalized)
      || (baseName && baseName.includes(keywordNormalized))
    );

  return {
    name,
    baseName,
    address,
    district,
    type,
    exactNameMatch,
    prefixNameMatch,
    containsNameMatch,
    addressMatch: Boolean(keywordNormalized) && address.includes(keywordNormalized),
    districtMatch: Boolean(keywordNormalized) && district.includes(keywordNormalized),
    typeMatch: Boolean(keywordNormalized) && type.includes(keywordNormalized)
  };
}

function getNameStrength(profile) {
  if (profile.exactNameMatch) {
    return 4;
  }

  if (profile.prefixNameMatch) {
    return 3;
  }

  if (profile.containsNameMatch) {
    return 2;
  }

  if (profile.addressMatch || profile.districtMatch || profile.typeMatch) {
    return 1;
  }

  return 0;
}

function getMatchScore(profile, keywordNormalized) {
  let score = 0;

  if (profile.exactNameMatch) {
    score += 1180;
  } else if (profile.prefixNameMatch) {
    score += 780;
  } else if (profile.containsNameMatch) {
    score += 560;
  }

  if (profile.addressMatch) {
    score += profile.exactNameMatch || profile.prefixNameMatch || profile.containsNameMatch ? 120 : 70;
  }

  if (profile.districtMatch) {
    score += 80;
  }

  if (profile.typeMatch) {
    score += 70;
  }

  if (!isGenericLocalIntent(keywordNormalized) && keywordNormalized.length >= 3) {
    if (profile.exactNameMatch) {
      score += 300;
    } else if (profile.prefixNameMatch) {
      score += 160;
    } else if (profile.containsNameMatch) {
      score += 70;
    }
  }

  return score;
}

function getDistanceScore(distanceMeters, genericLocalIntent) {
  if (!Number.isFinite(distanceMeters)) {
    return 0;
  }

  if (genericLocalIntent) {
    if (distanceMeters <= 500) return 300;
    if (distanceMeters <= 2000) return 250;
    if (distanceMeters <= 5000) return 200;
    if (distanceMeters <= 10000) return 150;
    if (distanceMeters <= 20000) return 100;
    if (distanceMeters <= 50000) return 45;
    return 0;
  }

  if (distanceMeters <= 500) return 110;
  if (distanceMeters <= 2000) return 90;
  if (distanceMeters <= 5000) return 72;
  if (distanceMeters <= 10000) return 52;
  if (distanceMeters <= 20000) return 32;
  if (distanceMeters <= 50000) return 16;
  return 0;
}

function getAncillaryPenalty(profile, keywordNormalized, genericLocalIntent) {
  if (genericLocalIntent) {
    return 0;
  }

  let penalty = 0;

  if (!profile.exactNameMatch && !profile.prefixNameMatch && !profile.containsNameMatch && profile.addressMatch) {
    penalty += 180;
  }

  ANCILLARY_NAME_TOKENS.forEach((token) => {
    const normalizedToken = normalizeText(token);
    if (!normalizedToken || !profile.name.endsWith(normalizedToken)) {
      return;
    }

    if (keywordNormalized.includes(normalizedToken) || profile.exactNameMatch) {
      return;
    }

    penalty += 150;
  });

  ANCILLARY_TYPE_TOKENS.forEach((token) => {
    const normalizedToken = normalizeText(token);
    if (!normalizedToken || !profile.type.includes(normalizedToken)) {
      return;
    }

    if (keywordNormalized.includes(normalizedToken) || profile.exactNameMatch) {
      return;
    }

    penalty += 100;
  });

  return penalty;
}

function getBranchStoreBoost(poi, profile, source) {
  if (source === 'global' || !profile.prefixNameMatch) {
    return 0;
  }

  const rawName = String(poi?.name || '');
  const hasBranchMarker = BRANCH_NAME_TOKENS.some((token) => rawName.includes(token))
    || rawName.includes('(')
    || rawName.includes('（');

  return hasBranchMarker ? 280 : 0;
}

function getSourceBonus(source, genericLocalIntent) {
  if (source === 'nearby') {
    return genericLocalIntent ? 360 : 220;
  }

  if (source === 'local') {
    return genericLocalIntent ? 180 : 110;
  }

  return genericLocalIntent ? 0 : 18;
}

function rankPoi(poi, { keywordNormalized, anchor, source, sourceIndex, genericLocalIntent }) {
  const distanceMeters = getDistanceMeters(poi, anchor);
  const profile = getMatchProfile(poi, keywordNormalized);
  const nameStrength = getNameStrength(profile);
  const matchScore = getMatchScore(profile, keywordNormalized);
  const distanceScore = getDistanceScore(distanceMeters, genericLocalIntent);
  const sourceBonus = getSourceBonus(source, genericLocalIntent);
  const branchStoreBoost = getBranchStoreBoost(poi, profile, source);
  const orderBonus = Math.max(0, 16 - sourceIndex);
  const ancillaryPenalty = getAncillaryPenalty(profile, keywordNormalized, genericLocalIntent);

  return {
    ...poi,
    distance: Number.isFinite(distanceMeters) ? distanceMeters : poi?.distance,
    _poiRank: matchScore + distanceScore + sourceBonus + branchStoreBoost + orderBonus - ancillaryPenalty,
    _poiSource: source,
    _poiDistance: distanceMeters,
    _poiMatchScore: matchScore,
    _poiNameStrength: nameStrength
  };
}

function dedupeAndSortPois(keyword, sortAnchor, groupedPois) {
  const keywordNormalized = normalizeText(keyword);
  const genericLocalIntent = isGenericLocalIntent(keywordNormalized);
  const rankedNearby = groupedPois.nearby.map((poi, index) => rankPoi(poi, {
    keywordNormalized,
    anchor: sortAnchor,
    source: 'nearby',
    sourceIndex: index,
    genericLocalIntent
  }));
  const rankedLocal = groupedPois.local.map((poi, index) => rankPoi(poi, {
    keywordNormalized,
    anchor: sortAnchor,
    source: 'local',
    sourceIndex: index,
    genericLocalIntent
  }));
  const rankedGlobal = groupedPois.global.map((poi, index) => rankPoi(poi, {
    keywordNormalized,
    anchor: sortAnchor,
    source: 'global',
    sourceIndex: index,
    genericLocalIntent
  }));

  const localCandidates = [...rankedNearby, ...rankedLocal];
  const hasLocalCandidates = localCandidates.length > 0;
  const candidates = genericLocalIntent && hasLocalCandidates
    ? [...rankedNearby, ...rankedLocal]
    : [...rankedNearby, ...rankedLocal, ...rankedGlobal];

  const byKey = new Map();

  candidates.forEach((rankedPoi) => {
    const key = getPoiKey(rankedPoi);
    const existing = byKey.get(key);

    if (!existing || rankedPoi._poiRank > existing._poiRank) {
      byKey.set(key, existing ? { ...existing, ...rankedPoi } : rankedPoi);
      return;
    }

    if (!Number.isFinite(existing.distance) && Number.isFinite(rankedPoi.distance)) {
      byKey.set(key, {
        ...existing,
        distance: rankedPoi.distance,
        _poiDistance: rankedPoi._poiDistance
      });
    }
  });

  return Array.from(byKey.values())
    .sort((left, right) => {
      const leftDistance = Number.isFinite(left._poiDistance) ? left._poiDistance : Number.POSITIVE_INFINITY;
      const rightDistance = Number.isFinite(right._poiDistance) ? right._poiDistance : Number.POSITIVE_INFINITY;

      if (genericLocalIntent && leftDistance !== rightDistance) {
        return leftDistance - rightDistance;
      }

      if (right._poiRank !== left._poiRank) {
        return right._poiRank - left._poiRank;
      }

      if (right._poiNameStrength !== left._poiNameStrength) {
        return right._poiNameStrength - left._poiNameStrength;
      }

      if (leftDistance !== rightDistance) {
        return leftDistance - rightDistance;
      }

      if (left._poiSource !== right._poiSource) {
        const sourceOrder = { nearby: 0, local: 1, global: 2 };
        return sourceOrder[left._poiSource] - sourceOrder[right._poiSource];
      }

      return 0;
    })
    .map(({ _poiRank, _poiSource, _poiDistance, _poiMatchScore, _poiNameStrength, ...poi }) => poi);
}

function createSearchRunner(createPlaceSearch, config = {}) {
  const instance = createPlaceSearch({
    pageSize: 10,
    pageIndex: 1,
    extensions: 'all',
    city: config.city || '',
    citylimit: Boolean(config.city && config.citylimit),
    type: config.type || ''
  });

  return instance;
}

function runKeywordSearch(createPlaceSearch, keyword, config = {}) {
  if (typeof createPlaceSearch !== 'function') {
    return Promise.resolve({ status: 'skipped', result: null });
  }

  const searcher = createSearchRunner(createPlaceSearch, config);
  return new Promise((resolve) => {
    searcher.search(keyword, (status, result) => resolve({ status, result }));
  });
}

function runNearbySearch(createPlaceSearch, keyword, anchor, radius, config = {}) {
  if (!anchor || typeof createPlaceSearch !== 'function') {
    return Promise.resolve({ status: 'skipped', result: null });
  }

  const searcher = createSearchRunner(createPlaceSearch, config);
  if (typeof searcher.searchNearBy !== 'function') {
    return Promise.resolve({ status: 'skipped', result: null });
  }

  return new Promise((resolve) => {
    searcher.searchNearBy(
      keyword,
      [anchor.longitude, anchor.latitude],
      radius,
      (status, result) => resolve({ status, result })
    );
  });
}

function resolveNearbyRadius(keywordNormalized, radius, typeIntent) {
  const safeRadius = Number.isFinite(Number(radius)) ? Math.max(Number(radius), 5000) : 50000;

  if (typeIntent?.nearbyOnly || isGenericLocalIntent(keywordNormalized)) {
    return Math.min(safeRadius, 15000);
  }

  return safeRadius;
}

function normalizeSearchResult(response, normalizePoi) {
  const pois = Array.isArray(response?.result?.poiList?.pois)
    ? response.result.poiList.pois.map(normalizePoi).filter(Boolean)
    : [];

  return {
    status: response?.status || 'error',
    result: response?.result || null,
    pois
  };
}

function isNonFatalStatus(status) {
  return status === 'complete' || status === 'no_data' || status === 'skipped';
}

function resolveSearchErrorMessage(responses) {
  const failed = responses.find((response) => !isNonFatalStatus(response.status));
  if (!failed) {
    return '';
  }

  const info = failed.result?.info || failed.result?.message || '';
  return info ? `地点搜索暂时失败：${info}` : `地点搜索暂时失败：${failed.status}`;
}

export async function searchPoisWithContext({
  createPlaceSearch,
  keyword,
  anchor = null,
  sortAnchor = anchor,
  locality = null,
  radius = 50000,
  normalizePoi
}) {
  const keywordNormalized = normalizeText(keyword);
  const typeIntent = resolveTypeIntent(keywordNormalized);
  const cityConstraint = resolveCityConstraint(locality);
  const nearbyRadius = resolveNearbyRadius(keywordNormalized, radius, typeIntent);
  const genericLocalIntent = isGenericLocalIntent(keywordNormalized);
  const groupedPois = {
    nearby: [],
    local: [],
    global: []
  };
  const responses = [];

  const nearbyKeywordResponse = normalizeSearchResult(
    await runNearbySearch(createPlaceSearch, keyword, anchor, nearbyRadius, {
      type: typeIntent?.type || ''
    }),
    normalizePoi
  );
  responses.push(nearbyKeywordResponse);
  groupedPois.nearby.push(...nearbyKeywordResponse.pois);

  if (typeIntent?.preferBlankKeyword) {
    const nearbyCategoryResponse = normalizeSearchResult(
      await runNearbySearch(createPlaceSearch, '', anchor, nearbyRadius, {
        type: typeIntent.type
      }),
      normalizePoi
    );
    responses.push(nearbyCategoryResponse);
    groupedPois.nearby.push(...nearbyCategoryResponse.pois);
  }

  if (cityConstraint) {
    const localKeywordResponse = normalizeSearchResult(
      await runKeywordSearch(createPlaceSearch, keyword, {
        city: cityConstraint,
        citylimit: true,
        type: typeIntent?.type || ''
      }),
      normalizePoi
    );
    responses.push(localKeywordResponse);
    groupedPois.local.push(...localKeywordResponse.pois);

    if (typeIntent?.preferBlankKeyword) {
      const localCategoryResponse = normalizeSearchResult(
        await runKeywordSearch(createPlaceSearch, '', {
          city: cityConstraint,
          citylimit: true,
          type: typeIntent.type
        }),
        normalizePoi
      );
      responses.push(localCategoryResponse);
      groupedPois.local.push(...localCategoryResponse.pois);
    }
  }

  const shouldRunGlobal = !genericLocalIntent
    || (groupedPois.nearby.length === 0 && groupedPois.local.length === 0);

  if (shouldRunGlobal) {
    const globalResponse = normalizeSearchResult(
      await runKeywordSearch(createPlaceSearch, keyword, {
        type: typeIntent?.nearbyOnly ? typeIntent.type : ''
      }),
      normalizePoi
    );
    responses.push(globalResponse);
    groupedPois.global.push(...globalResponse.pois);
  }

  const pois = dedupeAndSortPois(
    keyword,
    sortAnchor || anchor,
    groupedPois
  );

  const errorMessage = pois.length === 0
    ? resolveSearchErrorMessage(responses)
    : '';

  return {
    pois,
    errorMessage
  };
}
