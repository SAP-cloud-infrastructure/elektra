@javascript
Feature: Resource Management
  Background:
    Given Test user has accepted terms of use
    Given I visit domain path "home"
    And I log in as test_user
    Then I am redirected to domain path "home"

  @admin  
  Scenario: The Resource Management page is reachable
    When I visit project path "resource-management"
    Then the page status code is successful
    And I see "Manage Project Resources"
