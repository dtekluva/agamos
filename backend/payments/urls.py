from django.urls import path

from .views import (
    ContributionInitView, ContributionVerifyView,
    ContributionListView, ContributionThankView, WithdrawalListCreateView, DashboardView,
)

urlpatterns = [
    path("contributions/init", ContributionInitView.as_view()),
    path("contributions/verify", ContributionVerifyView.as_view()),
    path("contributions/<int:pk>/thank", ContributionThankView.as_view()),
    path("contributions", ContributionListView.as_view()),
    path("withdrawals", WithdrawalListCreateView.as_view()),
    path("dashboard", DashboardView.as_view()),
]
