'''
Author: Jack Lightholder
Date  : 9/27/19

Copyright 2019 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
import pytest
import sys

import numpy as np

sys.path.insert(1, os.getenv('CODEX_ROOT'))

from api.sub.hash       import DOCTEST_SESSION
from api.sub.hash       import get_cache
from api.sub.downsample import downsample

def test_downsample(capsys):

    ch = get_cache(DOCTEST_SESSION, timeout=None)
    array = np.random.rand(200)

    # REVISIT: downsample.py: "If one wishes to do a percentage, do the percentage to samples calculation in the calling function"
    # Intepreted to to include samples here, but that shouldn't be the case
    result = downsample(array, percentage=10, samples=20, session=ch)
    assert len(result) == 20

    result = downsample(array, samples=50, session=ch)
    assert len(result) == 50

    # More samples than in array
    result = downsample(array, samples=250, session=ch)
    assert len(result) == 200

    ch.resetCacheList("downsample")
    result1 = downsample(array, samples=50, session=ch)
    result2 = downsample(array, samples=50, session=ch)
    assert np.array_equal(result1, result2) == True

    # Disabled as there's no need with no followed assertions
    #result3 = downsample(array, percentage=120, session=ch)

    #result4 = downsample(array, session=ch)
