"use client";
import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import TestConsent from '@/components/TestConsent';

export default function TestConsentPage() {
    const router = useRouter();
    const params = useParams();
    const testId = params.testId;

    const handleConsent = () => {
        // User accepted terms and verified camera
        router.push(`/test/${testId}/take`);
    };

    return <TestConsent testId={testId} testTitle="Proctored Assessment" onConsent={handleConsent} />;
}
