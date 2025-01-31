'''
Author: Jack Lightholder
Date  : 2/20/18

Brief : Label manipulation library for CODEX

Notes :

'''
import os
import time
import h5py
import hashlib
import sys
import random
import math
import operator
import logging

import numpy as np

from random import shuffle

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

def label_swap(labels, dataHash, session=None):
    '''
    Inputs:

    Outputs:

    '''
    from api.sub.hash import get_cache
    cache = get_cache(session, timeout=None)

    test_uniq_labels = np.unique(labels)
    num_labels = labels.size

    tmp = cache.findHashArray("name", dataHash, "label")
    if(tmp is None):
        return labels

    saved_labels = tmp["data"]
    ref_uniq_labels = np.unique(saved_labels)
    num_saved_labels = saved_labels.size

    # If reference labels are from DBSCAN, don't attempt to use them
    if(np.any(ref_uniq_labels[:] == -1)):
        return labels

    # If test labels are from DBSCAN, don't attempt to use them
    if(np.any(test_uniq_labels[:] == -1)):
        return labels

    # Do not attempt to remap label colors if the k values of the
    #    test and reference label sets have a delta larger than 5
    if(abs(ref_uniq_labels.size - test_uniq_labels.size) > 5):
        logging.info("Difference between test and reference labels is too high, returning original labels")
        return labels

    finalMap = {}
    for z in range(0, test_uniq_labels.size):
        finalMap[str(z)] = None

    l_saved_labels = saved_labels.tolist()
    l_labels = labels.tolist()
    used = []

    # For each k-label
    for x in range(0, test_uniq_labels.size):

        whileCount = 0
        whileMax = 15
        while(finalMap[str(x)] is None):

            if(x in ref_uniq_labels):

                # Find the first index of the list with that k-label
                #	Compute on shuffeled list so first index is always different
                shuffle(l_saved_labels)
                ref_ind = l_saved_labels.index(x)

                # Get the label currently being used in new data at ref_ind
                # location
                cur_label = labels[ref_ind]

                # If the incoming label hasn't been used yet, use it. Else, try
                # again.
                if(finalMap[str(x)] is None):
                    if(cur_label not in used):
                        finalMap[str(x)] = cur_label
                        used.append(cur_label)

            # Exceeded reference label k-count. Move on and fill in later
            else:
                break

            # Non-convergence break for while loop
            if(whileCount > whileMax):
                break
            whileCount += 1

    # If test has more clusters than reference, some will not yet be filled (None)
    # 	Fill them in incrementally with k-labels which have not yet been used.
    for x in range(0, test_uniq_labels.size):
        if(finalMap[str(x)] is None):
            found = False
            for y in range(0, test_uniq_labels.size):
                if(y not in used and found == False):
                    finalMap[str(x)] = y
                    used.append(y)
                    found = True
            if(found == False):
                newMax = max(used)
                finalMap[str(x)] = newMax + 1
                used.append(newMax + 1)

    # Apply the "finalMap" translation dictionary on outgoing labels
    for j in range(0, labels.size):

        label = labels[j]
        newLabel = finalMap[str(label)]
        labels[j] = int(newLabel)

    return labels

